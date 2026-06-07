import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryCard } from '../types';
import { 
  playCardFlipSound, 
  playMatchSound, 
  playUnmatchSound, 
  playSuccessSound, 
  playGameOverSound, 
  playTapSound 
} from '../utils/audio';
import { 
  Brain, 
  RotateCcw, 
  Award, 
  Flame, 
  LogOut,
  Pizza,
  Rocket,
  Ghost,
  Crown,
  Dices,
  Gift,
  Key,
  Smile,
  LucideIcon
} from 'lucide-react';

interface MemoryGameProps {
  onBackToMenu: () => void;
  onUpdateHighScore: (score: number) => void;
  // stored as lowest moves. 0 means no record yet
  bestMoves: number;
}

// Map icon string names to standard Lucide React components safely
const ICON_COMPONENTS: { [key: string]: LucideIcon } = {
  Pizza,
  Rocket,
  Ghost,
  Crown,
  Dices,
  Gift,
  Key,
  Smile
};

const CARDS_POOL = [
  { item: 'Pizza', colorClass: 'text-orange-600 bg-orange-105 border-4 border-black font-black' },
  { item: 'Rocket', colorClass: 'text-indigo-600 bg-indigo-105 border-4 border-black font-black' },
  { item: 'Ghost', colorClass: 'text-purple-600 bg-purple-105 border-4 border-black font-black' },
  { item: 'Crown', colorClass: 'text-amber-600 bg-amber-105 border-4 border-black font-black' },
  { item: 'Dices', colorClass: 'text-rose-600 bg-rose-105 border-4 border-black font-black' },
  { item: 'Gift', colorClass: 'text-emerald-600 bg-emerald-105 border-4 border-black font-black' },
  { item: 'Key', colorClass: 'text-blue-600 bg-blue-105 border-4 border-black font-black' },
  { item: 'Smile', colorClass: 'text-yellow-600 bg-yellow-105 border-4 border-black font-black' },
];

export default function MemoryGame({ onBackToMenu, onUpdateHighScore, bestMoves }: MemoryGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [score, setScore] = useState(0); // Calculated retro score: e.g. Max(100, 1000 - moves * 20 + speedBonus)

  // Initialize and distribute game cards
  const startMemoryGame = () => {
    playTapSound();
    
    // Duplicate pool items to create matching pairs
    let doublePool = [...CARDS_POOL, ...CARDS_POOL].map((card, idx) => ({
      id: idx,
      pairId: card.item === 'Pizza' ? 1 
              : card.item === 'Rocket' ? 2 
              : card.item === 'Ghost' ? 3 
              : card.item === 'Crown' ? 4 
              : card.item === 'Dices' ? 5 
              : card.item === 'Gift' ? 6 
              : card.item === 'Key' ? 7 : 8,
      iconName: card.item,
      isFlipped: false,
      isMatched: false,
      colorClass: card.colorClass
    }));

    // Perform random shuffle
    doublePool.sort(() => Math.random() - 0.5);

    setCards(doublePool);
    setSelectedIndices([]);
    setMoves(0);
    setMatchesCount(0);
    setScore(0);
    setIsChecking(false);
    setGameState('playing');
  };

  const handleCardClick = (clickedIdx: number) => {
    // Escape guards
    if (isChecking) return;
    if (cards[clickedIdx].isMatched || cards[clickedIdx].isFlipped) return;
    if (selectedIndices.length >= 2) return;

    // Flip card visual states
    playCardFlipSound();
    const nextCards = [...cards];
    nextCards[clickedIdx].isFlipped = true;
    setCards(nextCards);

    const nextSelected = [...selectedIndices, clickedIdx];
    setSelectedIndices(nextSelected);

    // Analyze choice matching criteria once two cards are turned
    if (nextSelected.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);

      const [firstIdx, secondIdx] = nextSelected;
      const cardOne = cards[firstIdx];
      const cardTwo = cards[secondIdx];

      if (cardOne.pairId === cardTwo.pairId) {
        // MATCH DETECTED!
        setTimeout(() => {
          playMatchSound();
          const matchCards = [...cards];
          matchCards[firstIdx].isMatched = true;
          matchCards[secondIdx].isMatched = true;
          setCards(matchCards);
          setMatchesCount(prev => {
            const nextMatches = prev + 1;
            // Finished matching all 8 pairs!
            if (nextMatches === 8) {
              triggerGameEnd();
            }
            return nextMatches;
          });
          setSelectedIndices([]);
          setIsChecking(false);
        }, 500);
      } else {
        // MATCH MISSED
        setTimeout(() => {
          playUnmatchSound();
          const unFlipCards = [...cards];
          unFlipCards[firstIdx].isFlipped = false;
          unFlipCards[secondIdx].isFlipped = false;
          setCards(unFlipCards);
          setSelectedIndices([]);
          setIsChecking(false);
        }, 1100);
      }
    }
  };

  const triggerGameEnd = () => {
    // Score calculation
    const calculatedScore = Math.max(100, 1000 - moves * 20);
    setScore(calculatedScore);
    onUpdateHighScore(moves); // Persist moves to record (lower moves is better)
    setGameState('results');
    playSuccessSound();
  };

  const scoreRatingStars = () => {
    if (moves <= 12) return '⭐⭐⭐ Outstanding Brainmaster';
    if (moves <= 18) return '⭐⭐ Clever Genius';
    return '⭐ Quick Thinker';
  };

  return (
    <div id="memory-game-root" className="w-full max-w-2xl mx-auto flex flex-col min-h-[500px]">
      
      {/* CONTROL STRIP */}
      <div className="flex items-center justify-between mb-4 border-b-6 border-black pb-3">
        <div className="flex items-center gap-2">
          <Brain className="text-[#00FA9A] w-6 h-6 shrink-0 filter drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
          <h2 className="font-sans font-black text-xl uppercase text-black tracking-tight">Mind Memory Pairs</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-black text-black bg-[#FFD700] border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            RECORD: {bestMoves === 0 ? 'NO ENTRY' : `${bestMoves} MOVES`}
          </span>
          <button 
            id="memory-leave-button"
            onClick={() => { playTapSound(); onBackToMenu(); }}
            className="text-black bg-white hover:bg-[#00FA9A] hover:text-black border-2 border-black w-8 h-8 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
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
            <div className="w-20 h-20 bg-[#00FA9A] text-black border-4 border-black flex items-center justify-center mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              <Brain className="w-10 h-10 fill-current" />
            </div>

            <h3 className="font-sans font-black text-3xl uppercase tracking-tight text-black mb-2">
              Train Your Memory!
            </h3>
            <p className="text-xs text-black font-bold max-w-sm mb-6 leading-relaxed">
              Find and match all 8 matching hidden symbol pairs on the grid. Complete the matching game in fewest moves as possible to get a perfect score!
            </p>

            <motion.button
              id="memory-start-btn"
              whileTap={{ scale: 0.97 }}
              onClick={startMemoryGame}
              className="bg-[#00FA9A] text-black border-4 border-black font-black uppercase text-lg tracking-wider py-3.5 px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-2"
            >
              Start Matching
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
            {/* MATCH STATS */}
            <div className="grid grid-cols-2 gap-2 mb-4 items-center">
              <div className="text-left font-mono text-sm text-black font-black uppercase">
                Moves: <span className="text-black font-black">{moves}</span>
              </div>
              <div className="text-right font-mono text-sm text-black font-black uppercase">
                PAIRS SOLVED: <span className="font-black text-[#FF1493]">{matchesCount}/8</span>
              </div>
            </div>

            {/* CARDS SQUARE GRID LAYOUT */}
            <div 
              id="memory-arena-grid"
              className="grid grid-cols-4 gap-3 p-3 bg-black border-6 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto w-full aspect-square md:aspect-auto md:min-h-[380px]"
            >
              {cards.map((card, idx) => {
                const SelectedIcon = ICON_COMPONENTS[card.iconName];
                const isOpen = card.isFlipped || card.isMatched;

                return (
                  <div
                    id={`memory-card-outer-${idx}`}
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className="relative cursor-pointer w-full h-full perspective-800"
                  >
                    <motion.div
                      className="absolute inset-0 w-full h-full rounded-none transition-all duration-300 transform-style-3d shadow-none"
                      animate={{ rotateY: isOpen ? 180 : 0 }}
                      style={{ transformOrigin: 'center' }}
                    >
                      {/* CARD FRONT SIDE (HIDDEN SYMBOL SIDE) */}
                      <div 
                        id={`memory-card-front-${idx}`}
                        className={`absolute inset-0 backface-hidden w-full h-full border-4 border-black flex items-center justify-center font-black select-none bg-white`}
                        style={{ transform: 'rotateY(180deg)' }}
                      >
                        {SelectedIcon && (
                          <div className={`p-4 rounded-none transition-transform ${card.colorClass} scale-100 sm:scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                            <SelectedIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px]" />
                          </div>
                        )}
                      </div>

                      {/* CARD BACK SIDE (FACING UP COVER SIDE) */}
                      <div 
                        id={`memory-card-back-${idx}`}
                        className="absolute inset-0 backface-hidden w-full h-full border-4 border-black bg-gradient-to-br from-[#EEFFFF] to-[#DDFFFF] flex items-center justify-center text-black font-black hover:bg-[#FFD700] hover:border-black active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <Brain className="w-6 h-6 text-black fill-current animate-pulse" />
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-black/70 font-sans font-bold text-center mt-3">
              Flipping cards logs moves. Unmatched symbols flip cover down. Test your observation efficiency!
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
              Pairs Matching Solved!
            </h3>
            <span className="text-xs bg-[#00FA9A] text-black border-2 border-black px-4 py-1 font-black uppercase mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {scoreRatingStars()}
            </span>

            <p className="text-center text-xs text-black font-bold max-w-sm mb-6 leading-relaxed">
              Fantastic intellect skill! You unlocked and matched all 8 couples correctly.
            </p>

            {/* STATS DECK PANEL */}
            <div className="bg-[#FFEEFF] border-4 border-black p-4 w-full max-w-sm grid grid-cols-2 gap-4 mb-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <span className="block text-[10px] text-black font-mono font-black uppercase">MOVES TAKEN</span>
                <span className="text-2xl font-black text-[#FF1493]">{moves}</span>
                <span className="block text-[9px] text-black/70 font-mono font-bold leading-none mt-1">
                  TURNS
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-black font-mono font-black uppercase">BEST RECORD</span>
                <span className="text-2xl font-black text-emerald-600">
                  {bestMoves === 0 ? moves : bestMoves}
                </span>
                <span className="block text-[9px] text-black/70 font-mono font-bold leading-none mt-1">
                  LOWEST MOVES
                </span>
              </div>
            </div>

            {/* ACTION TRIGGERS */}
            <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-xs">
              <motion.button
                id="memory-retry-btn"
                whileTap={{ scale: 0.95 }}
                onClick={startMemoryGame}
                className="flex-1 bg-[#FFD700] hover:bg-yellow-300 text-black border-4 border-black font-black uppercase tracking-wider py-3.5 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <RotateCcw className="w-4 h-4 stroke-[3px]" /> Match Again
              </motion.button>
              <motion.button
                id="memory-back-menu-btn"
                whileTap={{ scale: 0.95 }}
                onClick={() => { playTapSound(); onBackToMenu(); }}
                className="flex-1 bg-white hover:bg-[#EEFFFF] text-black border-4 border-black font-black uppercase tracking-wider py-3.5 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
