import React, { useEffect, useRef, useState } from 'react';
import { Heart, ShootingStar, Theme, FireworkParticle } from '../types';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface CosmicBackgroundProps {
  photoUrls: string[];
  theme: Theme;
}

interface Particle3D {
  x: number;
  y: number;
  z: number; 
  size: number;
  isPhoto: boolean;
  photoIndex: number;
  color: string;
  initialAngle: number;
  radius: number;
  rotationOffset: number;
  twinkleSpeed?: number;
  twinklePhase?: number;
}

interface HitRegion {
    x: number;
    y: number;
    radius: number;
    index: number;
}

const PhotoOverlay: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // Refs for gesture calculation
    const startDist = useRef<number>(0);
    const startScale = useRef<number>(1);
    const startPos = useRef({ x: 0, y: 0 });
    const dragStart = useRef({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        // e.preventDefault(); // React synthetic events can't be defaulted this way usually, but we handle it
        const delta = -e.deltaY * 0.002;
        setScale(s => Math.max(1, Math.min(5, s + delta)));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch start
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            startDist.current = dist;
            startScale.current = scale;
        } else if (e.touches.length === 1) {
            // Drag start (only if zoomed)
            if (scale > 1) {
                setIsDragging(true);
                dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                startPos.current = { ...position };
            }
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch move
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (startDist.current > 0) {
                const newScale = startScale.current * (dist / startDist.current);
                setScale(Math.max(1, Math.min(5, newScale)));
            }
        } else if (e.touches.length === 1 && isDragging) {
            // Drag move
            const dx = e.touches[0].clientX - dragStart.current.x;
            const dy = e.touches[0].clientY - dragStart.current.y;
            setPosition({
                x: startPos.current.x + dx,
                y: startPos.current.y + dy
            });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        startDist.current = 0;
    };
    
    // Reset position if scaled back to 1
    useEffect(() => {
        if (scale === 1) {
            setPosition({ x: 0, y: 0 });
        }
    }, [scale]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose}>
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-4 z-50" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => setScale(s => Math.min(5, s + 0.5))}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                >
                    <ZoomIn size={24} />
                </button>
                <button 
                    onClick={() => setScale(s => Math.max(1, s - 0.5))}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                >
                    <ZoomOut size={24} />
                </button>
                <button 
                    onClick={onClose}
                    className="p-2 bg-white/10 rounded-full hover:bg-red-500/50 text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Image Container */}
            <div 
                className="relative w-full h-full flex items-center justify-center overflow-hidden" 
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image area
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img 
                    src={src} 
                    alt="Zoomed Memory" 
                    className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out select-none"
                    style={{ 
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                    }}
                    draggable={false}
                />
            </div>
            
            <div className="absolute bottom-6 text-white/50 text-sm pointer-events-none">
                {scale === 1 ? 'Chạm 2 ngón tay để phóng to' : 'Di chuyển để xem chi tiết'}
            </div>
        </div>
    );
};

const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ photoUrls, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // --- Shared State for Event Handlers & Animation Loop ---
  const heartsRef = useRef<Heart[]>([]); 
  const fireworksRef = useRef<FireworkParticle[]>([]);
  const hitRegionsRef = useRef<HitRegion[]>([]); // New: Store clickable photo regions

  // --- Camera & Interaction State ---
  const targetZ = useRef(2500); 
  const currentZ = useRef(2500); 
  
  // Rotation State
  const rotation = useRef({ x: -Math.PI / 6, y: 0 }); 
  const targetRotation = useRef({ x: -Math.PI / 6, y: 0 });
  
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number>(0);

  const autoRotateSpeed = useRef(0.001); 

  // New: Focused Photo State
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Load images
  useEffect(() => {
    imagesRef.current = [];
    if (photoUrls && photoUrls.length > 0) {
      photoUrls.forEach(url => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        imagesRef.current.push(img);
      });
    }
  }, [photoUrls]);

  // --- Interaction Handlers ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Helper: Create Explosion
    const createExplosion = (x: number, y: number, color: string) => {
        const particleCount = 30; // Number of sparks
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2; // Initial burst speed
            fireworksRef.current.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                color: color,
                size: Math.random() * 3 + 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
    };

    // Helper to check heart click
    const checkHeartInteraction = (clientX: number, clientY: number): boolean => {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Check collision with hearts (iterate backwards to hit top-most first)
        for (let i = heartsRef.current.length - 1; i >= 0; i--) {
            const h = heartsRef.current[i];
            
            const dist = Math.hypot(x - h.x, y - h.y);
            if (dist < h.size * 2.5) {
                createExplosion(h.x, h.y, h.color);
                heartsRef.current.splice(i, 1);
                return true; 
            }
        }
        return false;
    };

    // Helper to check photo click
    const checkPhotoInteraction = (clientX: number, clientY: number): boolean => {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Iterate backwards to find the top-most photo (closest z-index)
        for (let i = hitRegionsRef.current.length - 1; i >= 0; i--) {
            const region = hitRegionsRef.current[i];
            const dist = Math.hypot(x - region.x, y - region.y);
            if (dist < region.radius) {
                setFocusedIndex(region.index);
                return true;
            }
        }
        return false;
    };

    // Mouse Events
    const handleMouseDown = (e: MouseEvent) => {
      // 1. Check Heart Click
      if (checkHeartInteraction(e.clientX, e.clientY)) return;
      
      // 2. Check Photo Click
      if (checkPhotoInteraction(e.clientX, e.clientY)) return;

      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
      autoRotateSpeed.current = 0; 
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - lastMouse.current.x;
      const deltaY = e.clientY - lastMouse.current.y;
      
      const sensitivity = 0.005;
      targetRotation.current.y += deltaX * sensitivity;
      targetRotation.current.x += deltaY * sensitivity;

      targetRotation.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, targetRotation.current.x));

      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      canvas.style.cursor = 'grab';
      autoRotateSpeed.current = 0.0002;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 3.5;
      targetZ.current += e.deltaY * zoomSensitivity;
      targetZ.current = Math.max(-1200, Math.min(targetZ.current, 8000));
    };

    // Touch Events
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        if (checkHeartInteraction(e.touches[0].clientX, e.touches[0].clientY)) return;
        if (checkPhotoInteraction(e.touches[0].clientX, e.touches[0].clientY)) return;

        isDragging.current = true;
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        autoRotateSpeed.current = 0;
      } else if (e.touches.length === 2) {
        isDragging.current = false; // Zooming, not rotating
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchDist.current = dist;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 1 && isDragging.current) {
        // Rotate
        const deltaX = e.touches[0].clientX - lastMouse.current.x;
        const deltaY = e.touches[0].clientY - lastMouse.current.y;
        
        const sensitivity = 0.008; 
        targetRotation.current.y += deltaX * sensitivity;
        targetRotation.current.x += deltaY * sensitivity;
        
        targetRotation.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, targetRotation.current.x));

        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } 
      else if (e.touches.length === 2) {
        // Zoom
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = lastTouchDist.current - dist; 
        const touchSensitivity = 5.0;
        targetZ.current += delta * touchSensitivity;
        targetZ.current = Math.max(-1200, Math.min(targetZ.current, 8000));
        lastTouchDist.current = dist;
      }
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      autoRotateSpeed.current = 0.0002;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // --- Animation Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle3D[] = [];
    let shootingStars: ShootingStar[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    const fov = 800;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const isDisplayMode = photoUrls.length > 0;
      
      const dustCount = 3000;
      const innerRadius = 350;
      const outerRadius = 1400;

      // 1. Galaxy Ring Dust
      for(let i = 0; i < dustCount; i++) {
         const angle = Math.random() * Math.PI * 2;
         const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
         
         particles.push({
           x: Math.cos(angle) * radius,
           y: (Math.random() - 0.5) * 40, // Flat disk
           z: Math.sin(angle) * radius,
           radius: radius,
           size: Math.random() * 2.5 + 0.5,
           isPhoto: false,
           photoIndex: -1,
           color: Math.random() > 0.3 ? theme.primary : theme.secondary,
           initialAngle: angle,
           rotationOffset: 0
         });
      }

      // 2. Photo Particles
      if (isDisplayMode) {
        const photoCount = 50;
        for (let i = 0; i < photoCount; i++) {
           const angle = (i / photoCount) * Math.PI * 2 + (Math.random() * 0.5);
           const radius = innerRadius + 50 + Math.random() * (outerRadius - innerRadius - 100);
           
           particles.push({
             x: Math.cos(angle) * radius,
             y: (Math.random() - 0.5) * 60,
             z: Math.sin(angle) * radius,
             radius: radius,
             size: Math.random() * 50 + 40, 
             isPhoto: true,
             photoIndex: i % photoUrls.length,
             color: '#fff',
             initialAngle: angle,
             rotationOffset: Math.random() * Math.PI * 2
           });
        }
      }

      // 3. Background Stars
      for(let i = 0; i < 300; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 3000 + Math.random() * 2000;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        particles.push({
            x: x, y: y, z: z,
            radius: r,
            size: Math.random() * 2,
            isPhoto: false,
            photoIndex: -1,
            color: theme.starColor,
            initialAngle: 0,
            rotationOffset: 0,
            twinkleSpeed: Math.random() * 3 + 0.5,
            twinklePhase: Math.random() * Math.PI * 2
        })
      }
    };

    const createHeart = (randomY = false): Heart => {
      const colors = [theme.primary, theme.accent, theme.secondary, '#ffffff'];
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -50,
        size: Math.random() * 25 + 5, 
        speedY: Math.random() * 1.5 + 0.5,
        speedX: 0,
        wobble: Math.random() * Math.PI * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.6 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    };

    const createShootingStar = (): ShootingStar => {
      const spawnSide = Math.random() > 0.5 ? 'top' : 'left';
      let startX, startY;
      
      if (spawnSide === 'top') {
          startX = Math.random() * width;
          startY = -20;
      } else {
          startX = -20;
          startY = Math.random() * (height * 0.6); 
      }
      
      return {
        id: Math.random(),
        x: startX,
        y: startY, 
        length: Math.random() * 200 + 150, 
        speed: Math.random() * 4 + 3, 
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        opacity: 0 
      };
    };

    const initHearts = () => {
      heartsRef.current = [];
      for(let i = 0; i < 60; i++) {
        heartsRef.current.push(createHeart(true));
      }
    };

    let time = 0;

    const drawHeartShape = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
        ctx.save();
        ctx.beginPath();
        ctx.translate(x, y);
        const topCurveHeight = h * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(-w / 2, -h * 0.2, -w, topCurveHeight, 0, h);
        ctx.bezierCurveTo(w, topCurveHeight, w / 2, -h * 0.2, 0, topCurveHeight);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    const draw = () => {
      time += 0.01;

      // Reset Hit Regions for this frame
      hitRegionsRef.current = [];

      // 1. Interpolate Values
      const ease = 0.1;
      currentZ.current += (targetZ.current - currentZ.current) * ease;
      const cameraZ = currentZ.current;

      targetRotation.current.y += autoRotateSpeed.current; 
      rotation.current.x += (targetRotation.current.x - rotation.current.x) * ease;
      rotation.current.y += (targetRotation.current.y - rotation.current.y) * ease;

      const rotX = rotation.current.x;
      const rotY = rotation.current.y;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // 2. Clear Screen
      const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 1.5);
      bgGrad.addColorStop(0, theme.bgGradientStart);
      bgGrad.addColorStop(1, theme.bgGradientEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0,0,width,height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 3. Project Particles
      const projected = particles.map(p => {
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;
        let y1 = p.y; 

        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX;
        let x2 = x1; 

        const z_final = z2 + cameraZ;
        const scale = fov / (fov + z_final);
        
        return { 
            ...p, 
            screenX: centerX + x2 * scale, 
            screenY: centerY + y2 * scale, 
            scale, 
            zIndex: z_final 
        };
      });

      projected.sort((a, b) => a.zIndex - b.zIndex).reverse(); 

      // 4. Draw Planet Logic
      const planetZFinal = 0 + cameraZ;
      const planetScale = fov / (fov + planetZFinal);
      const planetScreenX = centerX;
      const planetScreenY = centerY;
      const planetRadiusBase = 180;
      
      const drawPlanet = () => {
          if (planetScale <= 0) return;
          const size = planetRadiusBase * planetScale;
          
          const glow = ctx.createRadialGradient(planetScreenX, planetScreenY, size * 0.5, planetScreenX, planetScreenY, size * 2);
          glow.addColorStop(0, `${theme.primary}CC`); 
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(planetScreenX, planetScreenY, size * 2, 0, Math.PI*2);
          ctx.fill();

          const sphereGrad = ctx.createRadialGradient(planetScreenX - size*0.3, planetScreenY - size*0.3, 0, planetScreenX, planetScreenY, size);
          sphereGrad.addColorStop(0, theme.primary);
          sphereGrad.addColorStop(1, theme.dark);
          ctx.fillStyle = sphereGrad;
          ctx.beginPath();
          ctx.arc(planetScreenX, planetScreenY, size, 0, Math.PI*2);
          ctx.fill();

          const hSize = size * 0.8;
          const hGrad = ctx.createRadialGradient(planetScreenX - hSize*0.3, planetScreenY - hSize*0.8, 0, planetScreenX, planetScreenY - hSize*0.5, hSize);
          hGrad.addColorStop(0, theme.secondary);
          hGrad.addColorStop(0.4, theme.accent); 
          hGrad.addColorStop(1, theme.dark); 
          
          const bob = Math.sin(time * 2) * (5 * planetScale);
          drawHeartShape(ctx, planetScreenX, planetScreenY - hSize*0.3 + bob, hSize, hSize, theme.accent); 
          
          ctx.save();
          ctx.beginPath();
          const heartPathH = hSize; 
          const heartPathW = hSize; 
          ctx.translate(planetScreenX, planetScreenY - hSize*0.3 + bob);
           const topCurveHeight = heartPathH * 0.3;
           ctx.moveTo(0, topCurveHeight);
           ctx.bezierCurveTo(-heartPathW / 2, -heartPathH * 0.2, -heartPathW, topCurveHeight, 0, heartPathH);
           ctx.bezierCurveTo(heartPathW, topCurveHeight, heartPathW / 2, -heartPathH * 0.2, 0, topCurveHeight);
          ctx.closePath();
          ctx.fillStyle = hGrad;
          ctx.fill();
          ctx.restore();
      };

      let planetDrawn = false;
      
      projected.forEach(p => {
        if (p.scale <= 0) return;

        if (!planetDrawn && p.zIndex < planetZFinal) {
            drawPlanet();
            planetDrawn = true;
        }

        let alpha = Math.min(1, p.scale * 2);
        if (p.zIndex < 50) alpha *= (p.zIndex / 50);

        const isClose = p.scale > 1.0;
        if (isClose && p.isPhoto) {
            alpha = 1.0; 
        }

        ctx.globalAlpha = alpha;

        if (p.isPhoto && p.photoIndex >= 0 && imagesRef.current[p.photoIndex]?.complete && photoUrls.length > 0) {
           const s = p.size * p.scale;
           
           // Register Hit Region (Store interactive data)
           hitRegionsRef.current.push({
               x: p.screenX,
               y: p.screenY,
               radius: s / 2,
               index: p.photoIndex
           });

           ctx.save();
           ctx.translate(p.screenX, p.screenY);
           
           ctx.rotate(p.initialAngle + time * 0.5); 
           
           ctx.shadowColor = `${theme.secondary}80`; 
           ctx.shadowBlur = 5 * p.scale;
           
           if (isClose) {
               ctx.fillStyle = theme.accent; 
               ctx.fillRect(-s/2 - 4, -s/2 - 4, s+8, s+8);
           } else {
               ctx.fillStyle = '#fff';
               ctx.fillRect(-s/2 - 2, -s/2 - 2, s+4, s+4);
           }

           try { ctx.drawImage(imagesRef.current[p.photoIndex], -s/2, -s/2, s, s); } catch (e) {}
           ctx.restore();
        } else {
           if (p.twinkleSpeed !== undefined && p.twinklePhase !== undefined) {
             const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * p.twinkleSpeed + p.twinklePhase));
             ctx.globalAlpha = alpha * twinkle;
           }

           const s = p.size * p.scale;
           ctx.beginPath();
           ctx.arc(p.screenX, p.screenY, s, 0, Math.PI * 2);
           ctx.fillStyle = p.color;
           ctx.fill();
        }
      });

      if (!planetDrawn) drawPlanet();
      ctx.globalAlpha = 1.0;

      // 6. Foreground overlays - SHOOTING STARS
      if (Math.random() < 0.015) shootingStars.push(createShootingStar());
      
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        
        if (s.opacity < 1 && s.x < width/3) { 
            s.opacity = Math.min(1, s.opacity + 0.02);
        } else {
            s.opacity -= 0.003; 
        }
        
        if (s.opacity <= 0 || s.x > width + 200 || s.y > height + 200) { 
            shootingStars.splice(i, 1); 
            continue; 
        }
        
        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;
        
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        grad.addColorStop(0.2, `${theme.secondary}${Math.floor(s.opacity * 255).toString(16).padStart(2,'0')}`);
        grad.addColorStop(0.5, `${theme.primary}${Math.floor(s.opacity * 100).toString(16).padStart(2,'0')}`);
        grad.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = grad; 
        ctx.lineWidth = 3; 
        ctx.lineCap = 'round';
        ctx.beginPath(); 
        ctx.moveTo(s.x, s.y); 
        ctx.lineTo(tailX, tailY); 
        ctx.stroke();

        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.accent;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }

      // 7. FIREWORKS
      for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
        const fp = fireworksRef.current[i];
        
        ctx.globalAlpha = fp.alpha;
        ctx.fillStyle = fp.color;
        
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
        ctx.fill();
        
        fp.x += fp.vx;
        fp.y += fp.vy;
        fp.vy += 0.1; 
        fp.vx *= 0.95; 
        fp.vy *= 0.95; 
        fp.alpha -= fp.decay;
        
        if (fp.alpha <= 0) {
            fireworksRef.current.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1.0;

      // Draw Falling Hearts
      if (Math.random() < 0.4) heartsRef.current.push(createHeart()); 
      
      for (let i = heartsRef.current.length - 1; i >= 0; i--) {
        const h = heartsRef.current[i]; 

        h.y += h.speedY; 
        h.x += Math.sin(h.wobble + time) * 0.5; 
        h.rotation += h.rotationSpeed;

        ctx.save(); 
        ctx.translate(h.x, h.y); 
        
        ctx.rotate(h.rotation * Math.PI / 180);
        
        ctx.shadowColor = h.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = Math.max(0, h.opacity);
        
        const w = h.size;
        const heartH = h.size;
        const topCurveHeight = heartH * 0.3;
        const yOff = -heartH * 0.4; 
        
        ctx.beginPath();
        ctx.moveTo(0, topCurveHeight + yOff);
        ctx.bezierCurveTo(-w / 2, -heartH * 0.2 + yOff, -w, topCurveHeight + yOff, 0, heartH + yOff);
        ctx.bezierCurveTo(w, topCurveHeight + yOff, w / 2, -heartH * 0.2 + yOff, 0, topCurveHeight + yOff);
        ctx.closePath();
        ctx.fillStyle = h.color;
        ctx.fill();

        ctx.restore();
        
        if (h.y > height + 50) heartsRef.current.splice(i, 1);
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0; 

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    initHearts();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [photoUrls, theme]);

  return (
    <div className="relative w-full h-full">
        <canvas 
            ref={canvasRef} 
            className="block w-full h-full cursor-grab active:cursor-grabbing" 
            style={{ touchAction: 'none' }}
        />
        {focusedIndex !== null && photoUrls[focusedIndex] && (
            <PhotoOverlay 
                src={photoUrls[focusedIndex]} 
                onClose={() => setFocusedIndex(null)} 
            />
        )}
    </div>
  );
};

export default CosmicBackground;