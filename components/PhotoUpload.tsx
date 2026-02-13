import React, { useRef } from 'react';
import { Upload, Images, Check, Sparkles } from 'lucide-react';
import { Theme, THEMES } from '../types';

interface PhotoUploadProps {
  onPhotosSelected: (files: File[]) => void;
  currentTheme: Theme;
  onThemeSelect: (theme: Theme) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotosSelected, currentTheme, onThemeSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files).slice(0, 10);
      onPhotosSelected(fileArray);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-4 animate-fade-in-up py-4">
      
      {/* 1. Theme Selector (Moved to Top) */}
      <div className="w-full mb-10 pointer-events-auto">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-80">
            <Sparkles size={14} className="text-pink-200" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-pink-100">1. Chọn Màu Vũ Trụ</span>
            <Sparkles size={14} className="text-pink-200" />
        </div>
        
        <div className="flex gap-4 justify-center flex-wrap">
            {THEMES.map((theme) => (
                <button
                    key={theme.id}
                    onClick={() => onThemeSelect(theme)}
                    className={`group relative w-12 h-12 rounded-full transition-all duration-300 ${currentTheme.id === theme.id ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black/50' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                    title={theme.name}
                >
                    {/* Gradient Background */}
                    <div 
                        className="absolute inset-0 rounded-full" 
                        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}
                    ></div>
                    
                    {/* Active Indicator */}
                    {currentTheme.id === theme.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Check size={18} className="text-white drop-shadow-md animate-fade-in" />
                        </div>
                    )}
                </button>
            ))}
        </div>
        <p className="text-center text-white/40 text-xs mt-3 italic font-light">{currentTheme.name}</p>
      </div>

      {/* 2. Upload Button (Compact & Refined) */}
      <div className="w-full pointer-events-auto">
         <div className="text-center mb-4 opacity-80">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-pink-100">2. Tải Ảnh Ký ức</span>
         </div>

        <div 
            onClick={handleClick}
            className="group relative cursor-pointer w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-500"
        >
             {/* Subtle Glow Background on Hover */}
             <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-xl"
                style={{ background: `radial-gradient(circle at center, ${currentTheme.primary}, transparent 70%)` }}
            ></div>

            <div className="relative z-10 flex items-center justify-between p-6 md:p-8">
                <div className="flex items-center gap-5">
                    <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                        <Images className="w-6 h-6" style={{ color: currentTheme.secondary }} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-medium text-white group-hover:text-pink-50 transition-colors">
                            Chọn 10 ảnh đẹp nhất
                        </h3>
                        <p className="text-xs text-white/40 mt-1 font-light">
                            Hỗ trợ JPG, PNG • Tự động sắp xếp
                        </p>
                    </div>
                </div>
                
                <div className="hidden md:block">
                     <Upload className="w-5 h-5 text-white/30 group-hover:text-white group-hover:-translate-y-1 transition-all duration-300" />
                </div>
            </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
};

export default PhotoUpload;