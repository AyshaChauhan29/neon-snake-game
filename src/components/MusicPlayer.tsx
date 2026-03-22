import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Upload, Disc } from 'lucide-react';

interface Track {
  id: string | number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

const DUMMY_TRACKS: Track[] = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "AI Synth-Wave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/300/300"
  },
  {
    id: 2,
    title: "Cyber Snake",
    artist: "Digital Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/300/300"
  },
  {
    id: 3,
    title: "Midnight Grid",
    artist: "Vapor AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/300/300"
  }
];

export const MusicPlayer: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(DUMMY_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    if (!audioRef.current) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyzerRef.current = audioCtxRef.current.createAnalyser();
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyzerRef.current);
      analyzerRef.current.connect(audioCtxRef.current.destination);
      analyzerRef.current.fftSize = 256;
    }

    if (isPlaying) {
      audioCtxRef.current.resume();
      audioRef.current.play().catch(e => console.error("Playback failed", e));
      startVisualizer();
    } else {
      audioRef.current.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  }, [isPlaying, currentTrackIndex]);

  const startVisualizer = () => {
    if (!canvasRef.current || !analyzerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyzerRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        const r = barHeight + (25 * (i / bufferLength));
        const g = 250 * (i / bufferLength);
        const b = 50;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      audioRef.current.currentTime = (newProgress / 100) * duration;
      setProgress(newProgress);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newTracks = Array.from(files).map((file: File, index) => ({
        id: `custom-${Date.now()}-${index}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local File",
        url: URL.createObjectURL(file),
        cover: `https://picsum.photos/seed/${file.name}/300/300`
      }));
      setTracks(prev => [...newTracks, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-full max-w-md bg-glitch-black border-4 border-glitch-magenta p-8 shadow-[10px_10px_0px_rgba(0,255,255,0.2)] relative overflow-hidden">
      {/* Visualizer Background */}
      <canvas 
        ref={canvasRef} 
        className="absolute bottom-0 left-0 w-full h-24 opacity-40 pointer-events-none"
        width={400}
        height={96}
      />

      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={onTimeUpdate}
        onEnded={handleNext}
        crossOrigin="anonymous"
      />
      
      <div className="flex flex-col items-center gap-8 relative z-10">
        <div className="relative group">
          <div className="absolute -inset-2 bg-glitch-cyan opacity-20 group-hover:opacity-40 transition-opacity animate-glitch" />
          <div className="relative w-40 h-40 border-4 border-glitch-cyan flex items-center justify-center bg-glitch-cyan/10">
            <Disc className={`text-glitch-cyan ${isPlaying ? 'animate-spin' : ''}`} size={64} style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 bg-glitch-magenta rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-glitch-cyan font-black text-xl tracking-tighter uppercase glitch-text" data-text={currentTrack.title}>{currentTrack.title}</h3>
          <p className="text-glitch-magenta font-mono text-[10px] uppercase tracking-[0.4em]">SRC::{currentTrack.artist}</p>
        </div>
      </div>

      <div className="mt-10 space-y-6 relative z-10">
        <div className="space-y-2">
          <div className="relative h-6 w-full bg-glitch-cyan/10 border-2 border-glitch-cyan overflow-hidden">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleProgressChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="absolute top-0 left-0 h-full bg-glitch-cyan shadow-[0_0_15px_#00ffff]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-glitch-cyan uppercase tracking-widest">
            <span>STREAMING_DATA</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={handlePrev}
            className="p-3 border-2 border-glitch-magenta text-glitch-magenta hover:bg-glitch-magenta hover:text-glitch-black transition-all"
          >
            <SkipBack size={24} />
          </button>

          <button 
            onClick={togglePlay}
            className="px-10 py-4 border-4 border-glitch-cyan bg-glitch-cyan text-glitch-black hover:bg-glitch-black hover:text-glitch-cyan transition-all"
          >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} className="ml-1" fill="currentColor" />}
          </button>

          <button 
            onClick={handleNext}
            className="p-3 border-2 border-glitch-magenta text-glitch-magenta hover:bg-glitch-magenta hover:text-glitch-black transition-all"
          >
            <SkipForward size={24} />
          </button>
        </div>

        <div className="flex items-center justify-between pt-6 border-t-2 border-glitch-cyan/20">
          <div className="flex items-center gap-4 flex-1">
            <Volume2 size={16} className="text-glitch-cyan" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              className="h-1 flex-1 bg-glitch-cyan/20 rounded-none appearance-none cursor-pointer accent-glitch-cyan"
            />
          </div>
          
          <label className="ml-6 p-3 border-2 border-glitch-magenta hover:bg-glitch-magenta hover:text-glitch-black cursor-pointer transition-all group">
            <Upload size={16} className="text-glitch-magenta group-hover:text-glitch-black" />
            <input type="file" accept="audio/*" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    </div>
  );
};
