import React, { useEffect, useRef } from 'react';
import { Heart, ShootingStar, Theme } from '../types';

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

const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ photoUrls, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // --- Camera & Interaction State ---
  const targetZ = useRef(2500); 
  const currentZ = useRef(2500); 
  
  // Rotation State (Orbit angles)
  // X: Pitch (Looking up/down), Y: Yaw (Looking left/right)
  const rotation = useRef({ x: -Math.PI / 6, y: 0 }); 
  const targetRotation = useRef({ x: -Math.PI / 6, y: 0 });
  
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number>(0);

  // Auto-rotation speed (idle spinning)
  const autoRotateSpeed = useRef(0.001); 

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

    // Mouse Events
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
      // Stop auto rotation when user interacts
      autoRotateSpeed.current = 0; 
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - lastMouse.current.x;
      const deltaY = e.clientY - lastMouse.current.y;
      
      const sensitivity = 0.005;
      targetRotation.current.y += deltaX * sensitivity;
      targetRotation.current.x += deltaY * sensitivity;

      // Limit Vertical Rotation (Pitch) to avoid flipping upside down
      // Clamp between -90 deg and 90 deg approx
      targetRotation.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, targetRotation.current.x));

      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      canvas.style.cursor = 'grab';
      // Resume slow auto rotation? Maybe keep it still or very slow
      autoRotateSpeed.current = 0.0002;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 3.5;
      targetZ.current += e.deltaY * zoomSensitivity;
      // Allow zooming much closer (negative value lets camera fly inside the ring)
      targetZ.current = Math.max(-1200, Math.min(targetZ.current, 8000));
    };

    // Touch Events
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
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
        
        const sensitivity = 0.008; // Higher sensitivity for touch
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
        // Allow zooming much closer
        targetZ.current = Math.max(-1200, Math.min(targetZ.current, 8000));
        lastTouchDist.current = dist;
      }
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      autoRotateSpeed.current = 0.0002;
    };

    // Add listeners
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
    let hearts: Heart[] = [];
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
           // Use theme colors
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
             // Increased base size for better visibility when zoomed
             size: Math.random() * 50 + 40, 
             isPhoto: true,
             photoIndex: i % photoUrls.length,
             color: '#fff',
             initialAngle: angle,
             rotationOffset: Math.random() * Math.PI * 2
           });
        }
      }

      // 3. Background Stars (Sphere distribution far away)
      for(let i = 0; i < 300; i++) {
        // Random point on sphere
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
      // Use theme colors for hearts with some variety
      const colors = [theme.primary, theme.accent, theme.secondary, '#ffffff'];
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -50,
        size: Math.random() * 25 + 5, // 5 to 30px
        speedY: Math.random() * 1.5 + 0.5,
        speedX: 0,
        wobble: Math.random() * Math.PI * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.6 + 0.1, // More subtle transparency
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    };

    const createShootingStar = (): ShootingStar => {
      const startX = Math.random() * width;
      const startY = Math.random() * (height * 0.7);
      
      return {
        id: Math.random(),
        x: startX,
        y: startY, 
        length: Math.random() * 100 + 100,
        speed: Math.random() * 20 + 20, 
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 degrees diagonal
        opacity: 1.0
      };
    };

    const initHearts = () => {
      hearts = [];
      // Initialize with many hearts covering the screen
      for(let i = 0; i < 60; i++) {
        hearts.push(createHeart(true));
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

      // 1. Interpolate Values
      const ease = 0.1;
      currentZ.current += (targetZ.current - currentZ.current) * ease;
      const cameraZ = currentZ.current;

      // Smooth Rotation
      targetRotation.current.y += autoRotateSpeed.current; // Idle spin
      rotation.current.x += (targetRotation.current.x - rotation.current.x) * ease;
      rotation.current.y += (targetRotation.current.y - rotation.current.y) * ease;

      const rotX = rotation.current.x;
      const rotY = rotation.current.y;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // 2. Clear Screen
      // Dynamic Gradient Background
      const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 1.5);
      bgGrad.addColorStop(0, theme.bgGradientStart);
      bgGrad.addColorStop(1, theme.bgGradientEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0,0,width,height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 3. Project Particles
      const projected = particles.map(p => {
        // 3D Rotation Matrix
        // Rotate around Y axis (Yaw)
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;
        let y1 = p.y; // Y doesn't change with Y-rotation

        // Rotate around X axis (Pitch)
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX;
        let x2 = x1; // X doesn't change with X-rotation

        // Translate Z (Camera Zoom)
        const z_final = z2 + cameraZ;
        
        // Perspective Project
        const scale = fov / (fov + z_final);
        
        return { 
            ...p, 
            screenX: centerX + x2 * scale, 
            screenY: centerY + y2 * scale, 
            scale, 
            zIndex: z_final // Distance from camera for sorting
        };
      });

      // Sort: Draw furthest first (Painters Algorithm)
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
          
          // Outer Glow
          const glow = ctx.createRadialGradient(planetScreenX, planetScreenY, size * 0.5, planetScreenX, planetScreenY, size * 2);
          glow.addColorStop(0, `${theme.primary}CC`); // ~80% opacity
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(planetScreenX, planetScreenY, size * 2, 0, Math.PI*2);
          ctx.fill();

          // Sphere Base (Theme Dark to Theme Primary)
          const sphereGrad = ctx.createRadialGradient(planetScreenX - size*0.3, planetScreenY - size*0.3, 0, planetScreenX, planetScreenY, size);
          sphereGrad.addColorStop(0, theme.primary);
          sphereGrad.addColorStop(1, theme.dark);
          ctx.fillStyle = sphereGrad;
          ctx.beginPath();
          ctx.arc(planetScreenX, planetScreenY, size, 0, Math.PI*2);
          ctx.fill();

          // Heart Billboard (Always on top of sphere)
          const hSize = size * 0.8;
          const hGrad = ctx.createRadialGradient(planetScreenX - hSize*0.3, planetScreenY - hSize*0.8, 0, planetScreenX, planetScreenY - hSize*0.5, hSize);
          hGrad.addColorStop(0, theme.secondary);
          hGrad.addColorStop(0.4, theme.accent); 
          hGrad.addColorStop(1, theme.dark); 
          
          // Slight bobbing for the heart
          const bob = Math.sin(time * 2) * (5 * planetScale);
          drawHeartShape(ctx, planetScreenX, planetScreenY - hSize*0.3 + bob, hSize, hSize, theme.accent); 
          // Re-draw with gradient for depth
          ctx.save();
          ctx.beginPath();
          const heartPathH = hSize; 
          const heartPathW = hSize; 
          // Clip heart
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

      // 5. Rendering Loop with Z-Sorting
      let planetDrawn = false;
      
      projected.forEach(p => {
        if (p.scale <= 0) return;

        // Check if we should draw planet now
        if (!planetDrawn && p.zIndex < planetZFinal) {
            drawPlanet();
            planetDrawn = true;
        }

        let alpha = Math.min(1, p.scale * 2);
        if (p.zIndex < 50) alpha *= (p.zIndex / 50);

        // Highlight effect when zoomed in close
        const isClose = p.scale > 1.0;
        if (isClose && p.isPhoto) {
            alpha = 1.0; // Force full opacity when close
        }

        ctx.globalAlpha = alpha;

        if (p.isPhoto && p.photoIndex >= 0 && imagesRef.current[p.photoIndex]?.complete && photoUrls.length > 0) {
           const s = p.size * p.scale;
           ctx.save();
           ctx.translate(p.screenX, p.screenY);
           
           ctx.rotate(p.initialAngle + time * 0.5); 
           
           ctx.shadowColor = `${theme.secondary}80`; // 50% opacity
           ctx.shadowBlur = 5 * p.scale;
           
           // Border/Frame Logic
           if (isClose) {
               ctx.fillStyle = theme.accent; // Highlight border when close
               ctx.fillRect(-s/2 - 4, -s/2 - 4, s+8, s+8);
           } else {
               ctx.fillStyle = '#fff';
               ctx.fillRect(-s/2 - 2, -s/2 - 2, s+4, s+4);
           }

           try { ctx.drawImage(imagesRef.current[p.photoIndex], -s/2, -s/2, s, s); } catch (e) {}
           ctx.restore();
        } else {
           // Apply twinkling for stars
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
      if (Math.random() < 0.025) shootingStars.push(createShootingStar());
      
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.02;
        
        if (s.opacity <= 0 || s.x > width || s.y > height) { 
            shootingStars.splice(i, 1); 
            continue; 
        }
        
        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;
        
        // Gradient Tail
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        grad.addColorStop(0.3, `${theme.secondary}${Math.floor(s.opacity * 200).toString(16).padStart(2,'0')}`);
        grad.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = grad; 
        ctx.lineWidth = 2; 
        ctx.lineCap = 'round';
        ctx.beginPath(); 
        ctx.moveTo(s.x, s.y); 
        ctx.lineTo(tailX, tailY); 
        ctx.stroke();

        // Glowing Head
        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.accent;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }

      // Draw Falling Hearts with shape and glow
      if (Math.random() < 0.4) hearts.push(createHeart()); // High frequency spawn
      
      for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i]; 
        h.y += h.speedY; 
        h.x += Math.sin(h.wobble + time) * 0.5; 
        h.rotation += h.rotationSpeed;

        ctx.save(); 
        ctx.translate(h.x, h.y); 
        ctx.rotate(h.rotation * Math.PI / 180);
        
        ctx.shadowColor = h.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = h.opacity;
        
        // Draw Heart Shape Path
        const w = h.size;
        const heartH = h.size;
        const topCurveHeight = heartH * 0.3;
        const yOff = -heartH * 0.4; // Center vertical alignment
        
        ctx.beginPath();
        ctx.moveTo(0, topCurveHeight + yOff);
        ctx.bezierCurveTo(-w / 2, -heartH * 0.2 + yOff, -w, topCurveHeight + yOff, 0, heartH + yOff);
        ctx.bezierCurveTo(w, topCurveHeight + yOff, w / 2, -heartH * 0.2 + yOff, 0, topCurveHeight + yOff);
        ctx.closePath();
        ctx.fillStyle = h.color;
        ctx.fill();

        ctx.restore();
        
        if (h.y > height + 50) hearts.splice(i, 1);
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0; // Reset shadow

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
  }, [photoUrls, theme]); // Added theme dependency

  return (
    <canvas 
        ref={canvasRef} 
        className="block w-full h-full cursor-grab active:cursor-grabbing" 
        style={{ touchAction: 'none' }}
    />
  );
};

export default CosmicBackground;