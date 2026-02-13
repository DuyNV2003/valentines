import React, { useState, useEffect } from 'react';
import CosmicBackground from './components/CosmicBackground';
import PhotoUpload from './components/PhotoUpload';
import { generateLoveMessage } from './services/geminiService';
import { AppState, Theme, THEMES } from './types';
import { Heart } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]); // Default to Passion

  const handlePhotosSelected = async (files: File[]) => {
    // Create local URLs for all files
    const urls = files.map(file => URL.createObjectURL(file));
    setPhotoUrls(urls);
    setAppState(AppState.GENERATING);

    // Simulate generating / loading delay
    await generateLoveMessage();
    setAppState(AppState.DISPLAY);
  };

  const handleReset = () => {
    // Revoke all
    photoUrls.forEach(url => URL.revokeObjectURL(url));
    setPhotoUrls([]);
    setAppState(AppState.IDLE);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      photoUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoUrls]);

  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-transparent">
      {/* Background layer - Handle reset on double click */}
      <div className="fixed inset-0 z-0" onDoubleClick={appState === AppState.DISPLAY ? handleReset : undefined}>
         <CosmicBackground photoUrls={photoUrls} theme={currentTheme} />
      </div>

      {/* Header - Only show when NOT in display mode */}
      {appState !== AppState.DISPLAY && (
        <header className="absolute top-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <Heart className="text-pink-500 fill-pink-500 animate-pulse" style={{ color: currentTheme.primary, fill: currentTheme.primary }} />
            <h1 className="text-2xl font-handwriting font-bold tracking-wider text-pink-100 shadow-lg" style={{ textShadow: `0 0 10px ${currentTheme.primary}` }}>Cosmic Valentine</h1>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20 pb-10 pointer-events-none">
        {appState === AppState.IDLE && (
          <div className="w-full max-w-4xl mx-auto animate-fade-in">
             <div className="text-center mb-10 space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 font-handwriting py-2 drop-shadow-sm"
                    style={{ backgroundImage: `linear-gradient(to right, ${currentTheme.secondary}, ${currentTheme.primary}, ${currentTheme.accent})` }}>
                  Vũ Trụ Trái Tim
                </h1>
                <p className="text-lg md:text-xl text-purple-200 max-w-2xl mx-auto px-4 drop-shadow-md">
                  Tải lên những khoảnh khắc đẹp nhất. Chúng tôi sẽ biến chúng thành một thiên hà tình yêu vĩnh cửu.
                </p>
             </div>
             <PhotoUpload 
                onPhotosSelected={handlePhotosSelected} 
                currentTheme={currentTheme} 
                onThemeSelect={setCurrentTheme} 
             />
          </div>
        )}

        {appState === AppState.GENERATING && (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-4 rounded-full animate-spin" style={{ borderColor: `${currentTheme.primary} transparent ${currentTheme.dark} transparent` }}></div>
              <div className="absolute inset-2 border-4 rounded-full animate-spin-slow" style={{ borderColor: `transparent ${currentTheme.secondary} transparent ${currentTheme.accent}` }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Heart className="w-12 h-12 animate-ping" style={{ color: currentTheme.primary, fill: currentTheme.primary }} />
              </div>
            </div>
            <p className="text-xl font-handwriting text-pink-200">Đang kiến tạo ngân hà tình yêu...</p>
          </div>
        )}

        {/* DISPLAY Mode: No UI elements, just the background. Subtle hint. */}
        {appState === AppState.DISPLAY && (
            <div className="absolute bottom-10 animate-pulse text-white/20 text-sm font-light select-none pointer-events-none">
                Double click anywhere to return
            </div>
        )}
      </main>

      {/* Footer - Only show when NOT in display mode */}
      {appState !== AppState.DISPLAY && (
        <footer className="absolute bottom-4 w-full text-center text-white/30 text-xs z-20 pointer-events-none">
          <p>© 2025 Cosmic Love Inc. Powered by Gemini.</p>
        </footer>
      )}
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 1s ease-out forwards;
        }
         @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;