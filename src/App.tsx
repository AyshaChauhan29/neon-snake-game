import { SnakeGame } from './components/SnakeGame';
import { MusicPlayer } from './components/MusicPlayer';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export default function App() {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.9) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 100);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen bg-glitch-black text-glitch-cyan font-sans selection:bg-glitch-magenta/30 overflow-hidden relative transition-all duration-75 ${isGlitching ? 'translate-x-2 scale-105' : ''}`}>
      {/* Static Noise Overlay */}
      <div className="noise-bg" />
      
      {/* Jarring Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_8px]" />

      <main className="relative z-20 flex flex-col items-center justify-center min-h-screen p-4 md:p-8 gap-12">
        <motion.header 
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="inline-block px-4 py-1 border-2 border-glitch-magenta bg-glitch-magenta/10 mb-4 animate-pulse">
            <span className="text-xs font-mono text-glitch-magenta uppercase tracking-[0.5em]">PROTOCOL_INIT // SECTOR_09</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-none glitch-text" data-text="VOID_RUNNER">
            VOID_RUNNER
          </h1>
          <div className="flex items-center justify-center gap-6 text-glitch-magenta font-mono text-xs uppercase tracking-[0.8em]">
            <span>NEURAL_LINK</span>
            <div className="w-2 h-2 bg-glitch-cyan rotate-45" />
            <span>DATA_FEED</span>
          </div>
        </motion.header>

        <div className="flex flex-col xl:flex-row items-center justify-center gap-16 w-full max-w-7xl">
          {/* Left Side: Cryptic Data */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden xl:flex flex-col gap-8 w-80"
          >
            <div className="p-6 border-2 border-glitch-cyan bg-glitch-cyan/5 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-glitch-cyan/20 -rotate-45 translate-x-4 -translate-y-4" />
              <h4 className="text-sm font-black text-glitch-cyan uppercase tracking-widest mb-6 border-b border-glitch-cyan/30 pb-2">SYSTEM_LOG</h4>
              <ul className="space-y-4 text-xs font-mono text-glitch-cyan/70">
                <li className="flex justify-between"><span>MEM_ADDR</span> <span className="text-glitch-magenta">0x7FF_A2</span></li>
                <li className="flex justify-between"><span>PKT_LOSS</span> <span className="text-glitch-magenta">0.003%</span></li>
                <li className="flex justify-between"><span>ENTROPY</span> <span className="text-glitch-magenta">MAX</span></li>
              </ul>
            </div>

            <div className="p-6 border-2 border-glitch-magenta bg-glitch-magenta/5 relative overflow-hidden">
              <h4 className="text-sm font-black text-glitch-magenta uppercase tracking-widest mb-6 border-b border-glitch-magenta/30 pb-2">NEURAL_NODES</h4>
              <div className="space-y-3">
                {['ALPHA', 'SIGMA', 'OMEGA'].map((node, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <span className="text-xs font-mono text-glitch-magenta/60 group-hover:text-glitch-magenta transition-colors">NODE_{node}</span>
                    <div className="flex gap-1">
                      {[1,2,3,4].map(b => <div key={b} className={`w-1 h-3 ${Math.random() > 0.5 ? 'bg-glitch-magenta' : 'bg-glitch-magenta/20'}`} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Center: The Core */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-4 border-4 border-glitch-cyan shadow-[20px_20px_0px_rgba(255,0,255,0.3)]"
          >
            <div className="absolute -top-6 -left-6 text-[10px] font-mono text-glitch-magenta bg-glitch-black px-2 border border-glitch-magenta">CORE_STABILITY: 88%</div>
            <SnakeGame />
          </motion.div>

          {/* Right: Frequency Stream */}
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            <MusicPlayer />
          </motion.div>
        </div>

        <footer className="mt-auto py-8 w-full border-t-2 border-glitch-cyan/20 flex flex-col md:flex-row items-center justify-between px-12 gap-6 bg-glitch-magenta/5">
          <div className="flex items-center gap-8">
            <span className="text-xs text-glitch-cyan uppercase tracking-[0.5em] font-mono animate-pulse">SIGNAL_STRENGTH: 100%</span>
          </div>
          <div className="text-glitch-magenta text-xs uppercase tracking-[0.8em] font-mono glitch-text" data-text="END_OF_LINE">
            END_OF_LINE
          </div>
        </footer>
      </main>
    </div>
  );
}
