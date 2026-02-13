import React, { useEffect, useState } from 'react';
import { RefreshCw, Share2, Sparkles } from 'lucide-react';

interface LoveDisplayProps {
  message: string;
  onReset: () => void;
}

const LoveDisplay: React.FC<LoveDisplayProps> = ({ message, onReset }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showButtons, setShowButtons] = useState(false);

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    const speed = 50; // ms per char
    const intervalId = setInterval(() => {
      setDisplayedText(message.slice(0, index + 1));
      index++;
      if (index >= message.length) {
        clearInterval(intervalId);
        setTimeout(() => setShowButtons(true), 500);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[80vh] px-4 text-center relative z-10 pointer-events-none pb-20">
      
      <div className="max-w-3xl mx-auto space-y-8 pointer-events-auto transform hover:scale-[1.01] transition-transform duration-700">
        
        {/* Glass Card for Text */}
        <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 p-8 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden group">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '2s' }}></div>
            
            <Sparkles className="absolute top-4 left-4 text-yellow-200/50 w-6 h-6 animate-pulse" />
            <Sparkles className="absolute bottom-4 right-4 text-pink-200/50 w-5 h-5 animate-pulse delay-700" />

            <h2 className="text-2xl md:text-4xl lg:text-5xl font-handwriting leading-relaxed text-transparent bg-clip-text bg-gradient-to-br from-white via-pink-100 to-purple-200 drop-shadow-[0_2px_10px_rgba(236,72,153,0.8)] min-h-[120px]">
            "{displayedText}"
            <span className="animate-blink inline-block w-1 h-8 ml-1 bg-pink-400 align-middle"></span>
            </h2>
        </div>
        
        <div className={`flex justify-center gap-6 mt-10 transition-opacity duration-1000 ${showButtons ? 'opacity-100' : 'opacity-0'}`}>
            <button 
                onClick={onReset}
                className="group flex items-center gap-2 px-8 py-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md transition-all text-gray-200 hover:text-white hover:scale-105"
            >
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                <span>Làm lại</span>
            </button>
             <button 
                onClick={() => alert("Chụp màn hình và gửi cho người ấy nhé!")}
                className="group flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 border border-white/20 transition-all text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_35px_rgba(236,72,153,0.8)] hover:scale-105"
            >
                <Share2 size={18} />
                <span>Chia sẻ</span>
            </button>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .group-hover\\:animate-shimmer {
            animation: shimmer 1.5s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
};

export default LoveDisplay;