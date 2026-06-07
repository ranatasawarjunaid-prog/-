import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TapTarget } from '../types';
import { 
  playTapSound, 
  playWrongSound, 
  playSuccessSound, 
  playGameOverSound, 
  playTickSound 
} from '../utils/audio';
import { Zap, Play, RotateCcw, ShieldAlert, Award, Star, Crosshair, ArrowLeft, LogOut } from 'lucide-react';

interface TapGameProps {
  onBackToMenu: () => void;
  onUpdateHighScore: (score: number) => void;
  currentHighScore: number;
}

export default function TapGame({ onBackToMenu, onUpdateHighScore, currentHighScore }: TapGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30 second rounds
  const [targets, setTargets] = useState<TapTarget[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [successfulTaps, setSuccessfulTaps] = useState(0);

  // References for game loops
  const targetIdCounter = useRef(0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const movementFrameRef = useRef<number | null>(null);

  // Motion physics configuration for targets
  const targetPhysics = useRef<{ [id: string]: { vx: number; vy: number } }>({});

  // Initialize and start game
  const startGame = () => {
    playTapSound();
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setTotalAttempts(0);
    setSuccessfulTaps(0);
    targetPhysics.current = {};
    targetIdCounter.current = 0;
    setGameState('playing');
  };

  // Spawn a target at a random location with customized velocities
  const spawnTarget = () => {
    const id = `target-${targetIdCounter.current++}`;
    const randType = Math.random();
    
    let type: 'normal' | 'bonus' | 'trap' = 'normal';
    let color = 'bg-sky-400 border-black border-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
    let points = 10;
    let size = 52; // Target diameter in px
    let duration = 3000; // Stay on screen for 3 seconds max

    if (randType > 0.85) {
      type = 'bonus';
      color = 'bg-[#FFD700] border-black border-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
      points = 25;
      size = 38; // Smaller & faster
      duration = 1800; // Demands instant reaction
    } else if (randType < 0.15) {
      type = 'trap';
      color = 'bg-[#FF1493] border-black border-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] animate-bounce';
      points = -15;
      size = 46;
      duration = 2500;
    }

    // Coordinates as percentage values (0-100) inside container
    // Keep them away from margins so they are fully tapable
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 80 + 10;

    // Movement speeds in percentage offset per animation frame
    const vx = (Math.random() - 0.5) * 0.7; // Drift left or right
    const vy = (Math.random() - 0.5) * 0.7; // Drift up or down

    const newTarget: TapTarget = {
      id,
      x,
      y,
      size,
      color,
      type,
      points,
      duration,
      createdAt: Date.now()
    };

    targetPhysics.current[id] = { vx, vy };

    setTargets(prev => [...prev, newTarget]);

    // Set a timeout to auto-remove target once duration expires
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== id));
      delete targetPhysics.current[id];
    }, duration);
  };

  // Main countdown timer and target spawner loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      return;
    }

    // Set countdown timer interval (1 second ticks)
    gameIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Finish game
          if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
          setGameState('results');
          return 0;
        }
        // Tick chime sound on the final countdown (5 seconds remaining)
        if (prev <= 6) {
          playTickSound();
        }
        return prev - 1;
      });

      // Periodic spawn trigger based on time
      // Spawn 1 or 2 targets depending on chaos levels
      const spawnCount = Math.random() > 0.5 ? 2 : 1;
      for (let i = 0; i < spawnCount; i++) {
        spawnTarget();
      }
    }, 1000);

    // Initial targets on launch
    spawnTarget();
    spawnTarget();

    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, [gameState]);

  // Physics animation frame loop to slide circles around "moving circles" criteria
  useEffect(() => {
    if (gameState !== 'playing') {
      if (movementFrameRef.current) cancelAnimationFrame(movementFrameRef.current);
      return;
    }

    const updateMovement = () => {
      setTargets(prevTargets => {
        return prevTargets.map(target => {
          const physics = targetPhysics.current[target.id];
          if (!physics) return target;

          let newX = target.x + physics.vx;
          let newY = target.y + physics.vy;

          // Bounce boundaries to keep target visually dynamic!
          let nextVx = physics.vx;
          let nextVy = physics.vy;

          if (newX <= 5 || newX >= 95) {
            nextVx = -physics.vx;
            newX = Math.max(5, Math.min(95, newX));
          }
          if (newY <= 5 || newY >= 95) {
            nextVy = -physics.vy;
            newY = Math.max(5, Math.min(95, newY));
          }

          // Write updated bounces back
          targetPhysics.current[target.id] = { vx: nextVx, vy: nextVy };

          return {
            ...target,
            x: newX,
            y: newY
          };
        });
      });

      movementFrameRef.current = requestAnimationFrame(updateMovement);
    };

    movementFrameRef.current = requestAnimationFrame(updateMovement);

    return () => {
      if (movementFrameRef.current) cancelAnimationFrame(movementFrameRef.current);
    };
  }, [gameState]);

  // Synchronise high scores when transition to Results screen occurs
  useEffect(() => {
    if (gameState === 'results') {
      onUpdateHighScore(score);
      if (score > currentHighScore) {
        playSuccessSound();
      } else {
        playGameOverSound();
      }
    }
  }, [gameState]);

  // Catch attempts on the arena background (missed clicks)
  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    
    // Increment total taps
    setTotalAttempts(prev => prev + 1);
  };

  const handleTargetClick = (e: React.MouseEvent, target: TapTarget) => {
    // Prevent propagating to parent arena clicks (otherwise it registers as a hit and miss simultaneous)
    e.stopPropagation();
    
    if (gameState !== 'playing') return;

    // Record correct target poppers
    setTotalAttempts(prev => prev + 1);

    if (target.type === 'trap') {
      // Unfortunate pop
      playWrongSound();
      setScore(prev => Math.max(0, prev + target.points));
    } else {
      // Good pop
      playTapSound();
      setSuccessfulTaps(prev => prev + 1);
      setScore(prev => prev + target.points);
    }

    // Instant remove popped target
    setTargets(prev => prev.filter(t => t.id !== target.id));
    delete targetPhysics.current[target.id];
  };

  const accuracyPercent = totalAttempts > 0 
    ? Math.round((successfulTaps / totalAttempts) * 100) 
    : 0;

  return (
    <div id="tap-game-root" className="w-full max-w-2xl mx-auto flex flex-col min-h-[500px]">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between mb-4 border-b-6 border-black pb-3">
        <div className="flex items-center gap-2">
          <Zap className="text-[#FF1493] w-6 h-6 fill-current animate-pulse shrink-0" />
          <h2 className="font-sans font-black text-xl uppercase text-black tracking-tight">Super Reaction Tap</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-black text-black bg-[#FFD700] border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            RECORD: {currentHighScore} PTS
          </span>
          <button 
            id="tap-leave-button"
            onClick={() => { playTapSound(); onBackToMenu(); }}
            className="text-black bg-white hover:bg-[#FF1493] hover:text-white border-2 border-black w-8 h-8 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
            title="Exit Game"
          >
            <LogOut className="w-4 h-4 font-black" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: INTRO */}
        {gameState === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white border-6 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="w-20 h-20 bg-[#FFD700] text-black border-4 border-black flex items-center justify-center mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              <Zap className="w-10 h-10 fill-current" />
            </div>

            <h3 className="font-sans font-black text-3xl uppercase tracking-tight text-black mb-2">
              Test Your Reflexes!
            </h3>
            <p className="text-xs text-black font-bold max-w-sm mb-6 leading-relaxed">
              Pop the moving circles as quickly as possible. Gold targets give major points, but avoid dangerous red spike balls or your score will drop!
            </p>

            {/* COLOR ENCYCLOPEDIA */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-6 text-xs text-left">
              <div className="bg-[#EEFFFF] border-4 border-black p-2 rounded-none flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="w-3.5 h-3.5 border-2 border-black rounded-full bg-sky-400 shrink-0"></span>
                <div>
                  <div className="font-black text-black text-[11px] leading-none mb-0.5">Normal</div>
                  <div className="text-[9px] text-[#1D7A73] font-black uppercase font-mono">+10 PTS</div>
                </div>
              </div>
              <div className="bg-[#FFFFD0] border-4 border-black p-2 rounded-none flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="w-3.5 h-3.5 border-2 border-black rounded-full bg-amber-400 shrink-0 animate-pulse"></span>
                <div>
                  <div className="font-black text-black text-[11px] leading-none mb-0.5">Gold</div>
                  <div className="text-[9px] text-amber-700 font-black uppercase font-mono">+25 PTS</div>
                </div>
              </div>
              <div className="bg-[#FFEEFF] border-4 border-black p-2 rounded-none flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="w-3.5 h-3.5 border-2 border-black rounded-full bg-rose-500 shrink-0 animate-bounce"></span>
                <div>
                  <div className="font-black text-black text-[11px] leading-none mb-0.5">Trap</div>
                  <div className="text-[9px] text-[#FF1493] font-black uppercase font-mono">-15 PTS</div>
                </div>
              </div>
            </div>

            <motion.button
              id="tap-start-btn"
              whileTap={{ scale: 0.97 }}
              onClick={startGame}
              className="bg-[#FF1493] text-white border-4 border-black font-black uppercase text-lg tracking-wider py-3.5 px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> Start Game (30s)
            </motion.button>
          </motion.div>
        )}

        {/* VIEW 2: GAMEPLAY PLAYING */}
        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* STATS STRIP */}
            <div className="grid grid-cols-3 gap-2 mb-3 items-center">
              <div className="text-left font-mono text-sm text-black font-black uppercase">
                Time: <span className={`font-black ${timeLeft <= 5 ? 'text-[#FF1493] animate-pulse' : 'text-black'}`}>{timeLeft}s</span>
              </div>
              <div className="text-center font-mono text-xl text-[#FF1493] font-black uppercase">
                {score} PTS
              </div>
              <div className="text-right font-mono text-xs text-black/75 font-black uppercase">
                Popped: {successfulTaps}
              </div>
            </div>

            {/* INTERACTIVE ARENA CONTAINER */}
            <div
              id="tap-game-arena"
              ref={arenaRef}
              onClick={handleArenaClick}
              className="relative flex-1 bg-black rounded-none h-[360px] overflow-hidden border-6 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] select-none cursor-crosshair"
            >
              {/* DECORATIVE BACKGROUND GRID */}
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              <AnimatePresence>
                {targets.map(target => (
                  <motion.button
                     id={`tap-arena-target-${target.id}`}
                     key={target.id}
                     onClick={(e) => handleTargetClick(e, target)}
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0, opacity: 0 }}
                     transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                     style={{
                       position: 'absolute',
                       left: `${target.x}%`,
                       top: `${target.y}%`,
                       width: `${target.size}px`,
                       height: `${target.size}px`,
                       transform: 'translate(-50%, -50%)',
                     }}
                     className={`rounded-full flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-90 transition-transform ${target.color}`}
                  >
                    {target.type === 'bonus' && (
                      <Star className="text-white w-4 h-4 fill-current animate-spin" />
                    )}
                    {target.type === 'trap' && (
                      <ShieldAlert className="text-white w-5 h-5 animate-bounce" />
                    )}
                    {target.type === 'normal' && (
                      <span className="block w-2.5 h-2.5 rounded-full bg-white opacity-40 translate-x-[-4px] translate-y-[-4px]" />
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>

              {/* EMPTY TARGETS PROMPT */}
              {targets.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-xs pointer-events-none select-none uppercase font-black tracking-widest">
                  Get Ready...
                </div>
              )}
            </div>
            
            <p className="text-[11px] text-black/70 font-sans font-bold text-center mt-2.5">
              Pop gold circles fast! Avoid red risk items. Missed snaps reduce precision rating.
            </p>
          </motion.div>
        )}

        {/* VIEW 3: RESULTS SCREEN */}
        {gameState === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-white border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="w-16 h-16 border-4 border-black bg-[#FFD700] text-black flex items-center justify-center mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-2xl">
              <Award className="w-8 h-8 font-black" />
            </div>

            <h3 className="font-sans font-black text-3xl uppercase tracking-tighter text-black mb-1">
              Time Expired!
            </h3>
            <p className="text-xs bg-[#FF1493] text-white border-2 border-black tracking-wider px-4 py-1 font-black uppercase mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {score > currentHighScore ? '⭐ NEW HIGH SCORE ⭐' : 'ROUND COMPLETE'}
            </p>

            {/* PERFORMANCE REPORT BENTO */}
            <div className="grid grid-cols-2 gap-3.5 w-full max-w-sm mb-6">
              <div className="bg-[#EEFFFF] p-3 border-4 border-black text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[9px] text-black font-mono font-black uppercase">TAPPING ACCURACY</span>
                <span className="text-xl font-black text-[#FF1493] flex items-center justify-center gap-1 leading-none my-1">
                  <Crosshair className="w-4 h-4 text-[#FF1493]" /> {accuracyPercent}%
                </span>
                <span className="block text-[9px] text-black/75 font-mono font-bold">
                  {successfulTaps} hit of {totalAttempts} taps
                </span>
              </div>
              <div className="bg-[#FFEEFF] p-3 border-4 border-black text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[9px] text-black font-mono font-black uppercase">SCORE SECURED</span>
                <span className="text-xl font-black text-emerald-600 leading-none block my-1">
                  {score} PTS
                </span>
                <span className="block text-[9px] text-black/70 font-mono font-semibold">
                  BEST: {Math.max(score, currentHighScore)}
                </span>
              </div>
            </div>

            {/* SPECIAL TEXT BASED ON EFFICIENCY */}
            <div className="text-xs text-black font-bold max-w-xs text-center mb-6 leading-relaxed">
              {accuracyPercent >= 80 && score >= 150 ? 'Outstanding! Your reaction speeds are lightning-fast ⚡' : 
               accuracyPercent >= 60 ? 'Splendid effort! You are gaining spectacular focus.' : 
               'Keep practicing to boost your accuracy and reflex timing!'}
            </div>

            {/* ACTION TRIGGERS */}
            <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-xs">
              <motion.button
                id="tap-retry-btn"
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="flex-1 bg-[#00FA9A] hover:bg-emerald-300 text-black border-4 border-black font-black uppercase tracking-wider py-3.5 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <RotateCcw className="w-4 h-4 stroke-[3px]" /> Try Again
              </motion.button>
              <motion.button
                id="tap-back-menu-btn"
                whileTap={{ scale: 0.95 }}
                onClick={() => { playTapSound(); onBackToMenu(); }}
                className="flex-1 bg-white hover:bg-neutral-100 text-black border-4 border-black font-black uppercase tracking-wider py-3.5 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Back to Hub
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
