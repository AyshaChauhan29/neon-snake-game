import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Zap, Ghost, Timer, ShieldAlert } from 'lucide-react';

type Point = { x: number; y: number };
type PowerUpType = 'SLOW' | 'GHOST' | 'MULTI' | 'NONE';

interface PowerUp {
  pos: Point;
  type: PowerUpType;
  expires: number;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

export const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [obstacles, setObstacles] = useState<Point[]>([]);
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType>('NONE');
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('snakeHighScore')) || 0);
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState(150);
  const [glitch, setGlitch] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  // Simple Synth SFX
  const playSFX = (type: 'eat' | 'powerup' | 'die' | 'turn') => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch(type) {
      case 'eat':
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'powerup':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'die':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'turn':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
    }
  };

  const generatePoint = useCallback((currentSnake: Point[], currentObstacles: Point[] = []): Point => {
    let newPoint: Point;
    while (true) {
      newPoint = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = currentSnake.some(s => s.x === newPoint.x && s.y === newPoint.y);
      const onObstacle = currentObstacles.some(o => o.x === newPoint.x && o.y === newPoint.y);
      if (!onSnake && !onObstacle) break;
    }
    return newPoint;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setObstacles([]);
    setFood(generatePoint(INITIAL_SNAKE));
    setPowerUp(null);
    setActivePowerUp('NONE');
    setIsGameOver(false);
    setScore(0);
    setIsPaused(false);
    setSpeed(150);
  };

  const moveSnake = useCallback(() => {
    if (isPaused || isGameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self (unless Ghost mode)
      if (activePowerUp !== 'GHOST' && prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        playSFX('die');
        setGlitch(true);
        setTimeout(() => setGlitch(false), 500);
        return prevSnake;
      }

      // Check collision with obstacles
      if (obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
        setIsGameOver(true);
        playSFX('die');
        setGlitch(true);
        setTimeout(() => setGlitch(false), 500);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check collision with food
      if (newHead.x === food.x && newHead.y === food.y) {
        const points = activePowerUp === 'MULTI' ? 30 : 10;
        setScore(s => {
          const newScore = s + points;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', String(newScore));
          }
          // Dynamic Obstacles: Add obstacle every 50 points
          if (newScore % 50 === 0) {
            setObstacles(prev => [...prev, generatePoint(newSnake, prev)]);
          }
          return newScore;
        });
        setFood(generatePoint(newSnake, obstacles));
        playSFX('eat');
        
        // Chance to spawn powerup
        if (Math.random() > 0.7 && !powerUp) {
          const types: PowerUpType[] = ['SLOW', 'GHOST', 'MULTI'];
          setPowerUp({
            pos: generatePoint(newSnake, obstacles),
            type: types[Math.floor(Math.random() * types.length)],
            expires: Date.now() + 5000
          });
        }
      } 
      // Check collision with powerup
      else if (powerUp && newHead.x === powerUp.pos.x && newHead.y === powerUp.pos.y) {
        setActivePowerUp(powerUp.type);
        setPowerUp(null);
        playSFX('powerup');
        
        if (powerUp.type === 'SLOW') setSpeed(250);
        
        setTimeout(() => {
          setActivePowerUp('NONE');
          setSpeed(150);
        }, 5000);
        newSnake.pop();
      }
      else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, generatePoint, obstacles, powerUp, activePowerUp, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let newDir = direction;
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) newDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (direction.y === 0) newDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (direction.x === 0) newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (direction.x === 0) newDir = { x: 1, y: 0 };
          break;
        case ' ':
          setIsPaused(p => !p);
          return;
      }
      if (newDir !== direction) {
        setDirection(newDir);
        playSFX('turn');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, speed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, speed]);

  // Clean up expired powerups
  useEffect(() => {
    const timer = setInterval(() => {
      if (powerUp && Date.now() > powerUp.expires) {
        setPowerUp(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [powerUp]);

  return (
    <div className={`flex flex-col items-center gap-6 transition-all duration-100 ${glitch ? 'animate-glitch' : ''}`}>
      <div className="flex justify-between w-full px-4 text-glitch-cyan font-mono text-sm uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-glitch-magenta" />
          <span>RECORD: {highScore}</span>
        </div>
        <div className="flex items-center gap-6">
          {activePowerUp !== 'NONE' && (
            <span className="text-xs font-black bg-glitch-magenta text-glitch-black px-2 animate-pulse">MOD::{activePowerUp}</span>
          )}
          <span className="text-xl font-black">DATA_PTS: {score}</span>
        </div>
      </div>
      
      <div 
        className={`relative bg-glitch-black border-4 overflow-hidden transition-colors duration-200 ${
          activePowerUp === 'GHOST' ? 'border-white shadow-[0_0_40px_rgba(255,255,255,0.3)]' : 
          activePowerUp === 'SLOW' ? 'border-glitch-cyan shadow-[0_0_40px_rgba(0,255,255,0.3)]' :
          activePowerUp === 'MULTI' ? 'border-glitch-magenta shadow-[0_0_40px_rgba(255,0,255,0.3)]' :
          'border-glitch-cyan shadow-[0_0_20px_rgba(0,255,255,0.2)]'
        }`}
        style={{ width: GRID_SIZE * 20, height: GRID_SIZE * 20 }}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 opacity-10">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-glitch-cyan" />
          ))}
        </div>

        {/* Obstacles */}
        {obstacles.map((o, i) => (
          <div
            key={`obs-${i}`}
            className="absolute bg-glitch-magenta/20 border border-glitch-magenta flex items-center justify-center animate-pulse"
            style={{ width: 18, height: 18, left: o.x * 20 + 1, top: o.y * 20 + 1 }}
          >
            <ShieldAlert size={12} className="text-glitch-magenta" />
          </div>
        ))}

        {/* Snake */}
        {snake.map((segment, i) => (
          <div
            key={i}
            className={`absolute transition-all duration-150 ${
              activePowerUp === 'GHOST' ? 'bg-white opacity-30 blur-[1px]' :
              i === 0 ? 'bg-glitch-cyan shadow-[0_0_20px_#00ffff]' : 'bg-glitch-cyan/40 border border-glitch-cyan/20'
            }`}
            style={{
              width: 18,
              height: 18,
              left: segment.x * 20 + 1,
              top: segment.y * 20 + 1,
              zIndex: 10
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-glitch-magenta shadow-[0_0_20px_#ff00ff] animate-glitch"
          style={{
            width: 16,
            height: 16,
            left: food.x * 20 + 2,
            top: food.y * 20 + 2,
            zIndex: 5
          }}
        />

        {/* PowerUp */}
        {powerUp && (
          <div
            className={`absolute flex items-center justify-center animate-bounce shadow-lg ${
              powerUp.type === 'SLOW' ? 'bg-glitch-cyan text-glitch-black' :
              powerUp.type === 'GHOST' ? 'bg-white text-glitch-black' :
              'bg-glitch-magenta text-glitch-black'
            }`}
            style={{
              width: 18,
              height: 18,
              left: powerUp.pos.x * 20 + 1,
              top: powerUp.pos.y * 20 + 1,
              zIndex: 5
            }}
          >
            {powerUp.type === 'SLOW' && <Timer size={12} />}
            {powerUp.type === 'GHOST' && <Ghost size={12} />}
            {powerUp.type === 'MULTI' && <Zap size={12} />}
          </div>
        )}

        {/* Overlays */}
        {(isGameOver || (isPaused && snake.length > 0)) && (
          <div className="absolute inset-0 bg-glitch-black/90 flex flex-col items-center justify-center backdrop-blur-sm z-50">
            {isGameOver ? (
              <div className="text-center">
                <h2 className="text-6xl font-black text-glitch-magenta mb-4 tracking-tighter uppercase glitch-text" data-text="FATAL_ERR">FATAL_ERR</h2>
                <p className="text-glitch-cyan font-mono mb-8 uppercase tracking-widest text-xs">DATA_LOSS: {score} UNITS</p>
                <button 
                  onClick={resetGame}
                  className="px-10 py-4 border-2 border-glitch-cyan text-glitch-cyan font-black uppercase hover:bg-glitch-cyan hover:text-glitch-black transition-all animate-pulse"
                >
                  RE_INITIALIZE
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button 
                  onClick={() => setIsPaused(false)}
                  className="w-24 h-24 flex items-center justify-center border-4 border-glitch-magenta text-glitch-magenta rounded-none hover:scale-110 transition-transform"
                >
                  <Zap size={48} fill="currentColor" />
                </button>
                <p className="mt-8 text-glitch-magenta font-mono text-xs uppercase tracking-[0.5em] animate-pulse">HALT_STATE</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
