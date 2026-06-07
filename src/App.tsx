import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameType } from './types';
import QuizGame from './components/QuizGame';
import TapGame from './components/TapGame';
import MemoryGame from './components/MemoryGame';
import { 
  isMuted, 
  setMuted, 
  playTapSound 
} from './utils/audio';
import { 
  Gamepad2, 
  Brain, 
  Zap, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Award, 
  ChevronRight, 
  Trash2,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameType>('menu');
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // States for persistent High Scores
  const [highScoreQuiz, setHighScoreQuiz] = useState<number>(0);
  const [highScoreTap, setHighScoreTap] = useState<number>(0);
  const [bestMovesMemory, setBestMovesMemory] = useState<number>(0);

  // Synchronize mute conditions on startup
  useEffect(() => {
    setAudioMuted(isMuted());
    
    // Read scores from localStorage safely
    if (typeof window !== 'undefined') {
      const qScore = localStorage.getItem('score_quiz');
      const tScore = localStorage.getItem('score_tap');
      const mScore = localStorage.getItem('score_memory'); // stored as minimum moves (lower is better, 0 means unplayed)
      
      if (qScore) setHighScoreQuiz(parseInt(qScore, 10));
      if (tScore) setHighScoreTap(parseInt(tScore, 10));
      if (mScore) setBestMovesMemory(parseInt(mScore, 10));
    }
  }, []);

  const handleMuteToggle = () => {
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) {
      // Small sound feedback when user un-mutes
      setTimeout(() => playTapSound(), 50);
    }
  };

  const updateQuizHighScore = (score: number) => {
    if (score > highScoreQuiz) {
      setHighScoreQuiz(score);
      localStorage.setItem('score_quiz', score.toString());
    }
  };

  const updateTapHighScore = (score: number) => {
    if (score > highScoreTap) {
      setHighScoreTap(score);
      localStorage.setItem('score_tap', score.toString());
    }
  };

  const updateMemoryHighScore = (moves: number) => {
    // For memory, 0 means no record, or lower moves count is better
    if (bestMovesMemory === 0 || moves < bestMovesMemory) {
      setBestMovesMemory(moves);
      localStorage.setItem('score_memory', moves.toString());
    }
  };

  const resetAllStats = () => {
    if (window.confirm('Are you sure you want to reset all your gaming scores and records?')) {
      playTapSound();
      localStorage.removeItem('score_quiz');
      localStorage.removeItem('score_tap');
      localStorage.removeItem('score_memory');
      setHighScoreQuiz(0);
      setHighScoreTap(0);
      setBestMovesMemory(0);
    }
  };

  const selectGame = (game: GameType) => {
    playTapSound();
    setActiveGame(game);
  };

  return (
    <div className="min-h-screen bg-[#FFD700] text-[#1A1A1A] flex items-center justify-center p-3 sm:p-6 font-sans selection:bg-[#8A2BE2] selection:text-white">
      
      {/* PHONE/DESKTOP WRAPPER DECK CONTAINER */}
      <div 
        id="applet-container" 
        className="w-full max-w-xl bg-white border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col transition-all overflow-hidden"
      >
        
        {/* APP TITLE / SOUND BAR */}
        <header className="px-5 py-5 border-b-8 border-black bg-white flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => selectGame('menu')}>
            <div className="w-10 h-10 bg-black border-4 border-black text-[#FFD700] flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <Gamepad2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-sans font-black text-xl tracking-tighter uppercase text-[#1A1A1A] leading-none mb-1">
                Arcade Mini Game Hub
              </h1>
              <span className="block text-[10px] text-black/75 font-mono font-black uppercase tracking-widest leading-none">
                Arcade Edition v1.0
              </span>
            </div>
          </div>

          {/* AUDIO TOGGLER CONTROL */}
          <button
            id="sound-mute-control"
            onClick={handleMuteToggle}
            className={`p-2.5 border-4 border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer ${
              audioMuted 
                ? 'bg-[#FF1493] text-white hover:bg-opacity-95' 
                : 'bg-[#00FA9A] text-black hover:bg-opacity-95'
            }`}
            title={audioMuted ? "Unmute Sounds" : "Mute Sounds"}
          >
            {audioMuted ? <VolumeX className="w-4 h-4 font-black" /> : <Volume2 className="w-4 h-4 font-black" />}
          </button>
        </header>

        {/* INTERACTIVE COMPONENT ROTATOR PANEL */}
        <main className="flex-1 p-5 flex flex-col justify-between bg-[#FFFDF0]">
          <AnimatePresence mode="wait">
            
            {/* VIEW A: MENU DASHBOARD */}
            {activeGame === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="flex-1 flex flex-col gap-6"
              >
                {/* WELCOMING HERO */}
                <div className="text-center py-2 shrink-0">
                  <span className="text-[11px] uppercase font-black tracking-widest text-[#1A1A1A] bg-[#FFD700] border-4 border-black px-4 py-1.5 inline-flex items-center gap-1.5 mb-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="w-3.5 h-3.5 fill-current" /> Free Play Arcade
                  </span>
                  <h2 className="font-sans font-black text-5xl uppercase tracking-tighter text-black leading-none my-2">
                    ARCADE<br />GAME HUB
                  </h2>
                  <p className="text-xs text-[#1A1A1A]/80 font-bold max-w-sm mx-auto leading-normal">
                    Sharpen focus, test lightning reflex speed, or train memory with single-session retro-styled games!
                  </p>
                </div>

                {/* GAME SELECTION RAIL */}
                <div className="grid grid-cols-1 gap-4.5 flex-1">
                  
                  {/* GAME CARD 1: QUIZ GAME */}
                  <motion.button
                    id="menu-select-quiz"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectGame('quiz')}
                    className="flex items-center justify-between p-5 bg-[#8A2BE2] border-6 border-black text-white hover:brightness-105 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white border-4 border-black text-[#8A2BE2] flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] shrink-0">
                        <span className="text-3xl">🧠</span>
                      </div>
                      <div>
                        <h3 className="font-black uppercase tracking-tight text-2xl leading-none mb-1">Quiz Game</h3>
                        <p className="text-xs text-white/95 font-bold line-clamp-1">
                          Test your knowledge with trivia quiz questions.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white shrink-0" />
                  </motion.button>

                  {/* GAME CARD 2: TAP REFLEX GAME */}
                  <motion.button
                    id="menu-select-tap"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectGame('tap')}
                    className="flex items-center justify-between p-5 bg-[#FF1493] border-6 border-black text-white hover:brightness-105 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white border-4 border-black text-[#FF1493] flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] shrink-0">
                        <span className="text-3xl">⚡</span>
                      </div>
                      <div>
                        <h3 className="font-black uppercase tracking-tight text-2xl leading-none mb-1">Tap Game</h3>
                        <p className="text-xs text-white/95 font-bold line-clamp-1">
                          Tap drifting circles. Fast-paced pure reaction.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white shrink-0" />
                  </motion.button>

                  {/* GAME CARD 3: MEMORY MATCH */}
                  <motion.button
                    id="menu-select-memory"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectGame('memory')}
                    className="flex items-center justify-between p-5 bg-[#00FA9A] border-6 border-black text-black hover:brightness-105 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-black border-4 border-black text-[#00FA9A] flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] shrink-0">
                        <span className="text-3xl">🧩</span>
                      </div>
                      <div>
                        <h3 className="font-black uppercase tracking-tight text-2xl leading-none mb-1 text-[#1A1A1A]">Memory Game</h3>
                        <p className="text-xs text-[#1A1A1A]/90 font-bold line-clamp-1">
                          Find pairs. Match the secret cards under covers.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-black shrink-0" />
                  </motion.button>

                </div>

                {/* GAME CENTER HIGH SCORES STAT PANEL */}
                <div className="bg-[#FFFFD0] border-6 border-black p-4 rounded-none mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-3 border-b-4 border-black pb-2">
                    <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4" /> Arcade Leaderboard stats
                    </span>
                    <button
                      id="reset-stats-btn"
                      onClick={resetAllStats}
                      className="text-[10px] text-white bg-black hover:bg-neutral-800 border-2 border-black px-2.5 py-1 rounded-none uppercase tracking-wide font-black transition-colors cursor-pointer"
                    >
                      Reset All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-white border-4 border-black p-2 rounded-none">
                      <span className="block text-[9px] text-[#1A1A1A] font-mono font-black uppercase">Quiz Peak</span>
                      <span className="text-lg font-black text-[#8A2BE2] block mt-0.5 leading-none">{highScoreQuiz}</span>
                      <span className="block text-[8px] text-[1A1A1A]/70 font-mono uppercase font-bold">points</span>
                    </div>
                    <div className="bg-white border-4 border-black p-2 rounded-none">
                      <span className="block text-[9px] text-[#1A1A1A] font-mono font-black uppercase">Tap high</span>
                      <span className="text-lg font-black text-[#FF1493] block mt-0.5 leading-none">{highScoreTap}</span>
                      <span className="block text-[8px] text-[1A1A1A]/70 font-mono uppercase font-bold">points</span>
                    </div>
                    <div className="bg-white border-4 border-black p-2 rounded-none">
                      <span className="block text-[9px] text-[#1A1A1A] font-mono font-black uppercase">Memory best</span>
                      <span className="text-lg font-black text-[#00AF6A] block mt-0.5 leading-none">
                        {bestMovesMemory === 0 ? '---' : `${bestMovesMemory}`}
                      </span>
                      <span className="block text-[8px] text-[1A1A1A]/70 font-mono uppercase font-bold">moves</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* VIEW B: QUIZ COMPONENT */}
            {activeGame === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <QuizGame
                  onBackToMenu={() => setActiveGame('menu')}
                  onUpdateHighScore={updateQuizHighScore}
                  currentHighScore={highScoreQuiz}
                />
              </motion.div>
            )}

            {/* VIEW C: TAP COMPONENT */}
            {activeGame === 'tap' && (
              <motion.div
                key="tap"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <TapGame
                  onBackToMenu={() => setActiveGame('menu')}
                  onUpdateHighScore={updateTapHighScore}
                  currentHighScore={highScoreTap}
                />
              </motion.div>
            )}

            {/* VIEW D: MEMORY COMPONENT */}
            {activeGame === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col animate-perspective"
              >
                <MemoryGame
                  onBackToMenu={() => setActiveGame('menu')}
                  onUpdateHighScore={updateMemoryHighScore}
                  bestMoves={bestMovesMemory}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* DEVICE COMPLIANCE OUTLET CREDIT */}
        <footer className="py-3 bg-black border-t-8 border-black text-center shrink-0">
          <p className="text-[10px] font-mono font-black uppercase tracking-widest text-white">
            Arcade Platform &copy; 2026 PLAYER_ONE RANK #01
          </p>
        </footer>

      </div>

    </div>
  );
}
