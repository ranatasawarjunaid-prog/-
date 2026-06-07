import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QUESTIONS } from '../data/quizQuestions';
import { QuizQuestion } from '../types';
import { 
  playCorrectSound, 
  playWrongSound, 
  playSuccessSound, 
  playGameOverSound, 
  playTapSound 
} from '../utils/audio';
import { Award, RefreshCw, ChevronRight, HelpCircle, Flame, Check, X, BookOpen, LogOut } from 'lucide-react';

interface QuizGameProps {
  onBackToMenu: () => void;
  onUpdateHighScore: (score: number) => void;
  currentHighScore: number;
}

export default function QuizGame({ onBackToMenu, onUpdateHighScore, currentHighScore }: QuizGameProps) {
  // Game states
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro');

  // Initialize and shuffle questions (select 10 random questions)
  const startQuiz = () => {
    playTapSound();
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 10));
    setCurrentIndex(0);
    setSelectedIdx(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'intro') {
      // automatically start or let them press start
    }
  }, [gameState]);

  const handleOptionSelect = (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedIdx(optionIdx);
    setIsAnswered(true);

    const question = questions[currentIndex];
    const isCorrect = optionIdx === question.answer;

    if (isCorrect) {
      playCorrectSound();
      const currentStreak = streak + 1;
      setStreak(currentStreak);
      if (currentStreak > maxStreak) {
        setMaxStreak(currentStreak);
      }
      setCorrectCount(prev => prev + 1);

      // Streak multiplier bonus: base 10 + currentStreak bonus points
      const pointsEarned = 10 + Math.min(currentStreak - 1, 5) * 2; 
      setScore(prev => prev + pointsEarned);
    } else {
      playWrongSound();
      setStreak(0);
    }
  };

  const handleNext = () => {
    playTapSound();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
    } else {
      // End game
      setGameState('results');
      onUpdateHighScore(score);
      
      // Select appropriate success or cheer sound
      if (correctCount >= 7) {
        playSuccessSound();
      } else {
        playGameOverSound();
      }
    }
  };

  // Badge/Rank calculator
  const getResultsBadge = () => {
    const pct = (correctCount / questions.length) * 100;
    if (pct === 100) return { title: 'Omniscient Legend 👑', desc: 'Flawless victory! You know everything!', color: 'from-amber-400 to-yellow-600' };
    if (pct >= 80) return { title: 'Quiz Wizard 🧙‍♂️', desc: 'Incredible intellect! Almost perfect!', color: 'from-purple-500 to-indigo-700' };
    if (pct >= 50) return { title: 'Smart Cadet 🚀', desc: 'Great job! Ready to climb even higher?', color: 'from-blue-400 to-sky-600' };
    return { title: 'Beginner Explorer 🥚', desc: 'Keep learning, you have got this!', color: 'from-emerald-400 to-teal-600' };
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div id="quiz-game-root" className="w-full max-w-2xl mx-auto flex flex-col min-h-[500px]">
      
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between mb-4 border-b-6 border-black pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="text-[#8A2BE2] w-6 h-6 shrink-0" />
          <h2 className="font-sans font-black text-xl uppercase text-black tracking-tight">Trivia Quiz Challenge</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-black text-black bg-[#FFD700] border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            BEST: {currentHighScore} PTS
          </span>
          <button 
            id="quiz-leave-button"
            onClick={() => { playTapSound(); onBackToMenu(); }}
            className="text-black bg-white hover:bg-rose-500 hover:text-white border-2 border-black w-8 h-8 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
            title="Exit Game"
          >
            <LogOut className="w-4 h-4 font-black" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* INTRO/START VIEW */}
        {gameState === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white border-6 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="w-20 h-20 bg-[#FFD700] text-black border-4 border-black flex items-center justify-center mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              <HelpCircle className="w-10 h-10 font-bold" />
            </div>
            <h3 className="font-sans font-black text-3xl text-black uppercase tracking-tight mb-2">Test Your Knowledge!</h3>
            <p className="text-xs text-black font-bold max-w-sm mb-6 leading-relaxed">
              Answer 10 random trivia questions across various fun categories. Build a streak to gain extra multiplier bonus points!
            </p>

            <div className="bg-[#FFFFD0] border-4 border-black p-4 w-full max-w-sm mb-6 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <h4 className="text-xs font-black text-black flex items-center gap-1.5 mb-1 uppercase tracking-wide">
                <Flame className="w-3.5 h-3.5 fill-current text-[#FF1493]" /> Streak Multiplier Active
              </h4>
              <p className="text-xs text-black font-bold leading-normal">
                Every consecutive correct answer increases your bonus points. Don't make mistakes or you'll reset your streak!
              </p>
            </div>

            <motion.button
              id="quiz-start-btn"
              whileTap={{ scale: 0.97 }}
              onClick={startQuiz}
              className="bg-[#8A2BE2] text-white border-4 border-black font-black uppercase text-lg tracking-wider py-3.5 px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-2"
            >
              Start Game
            </motion.button>
          </motion.div>
        )}

        {/* PLAYING VIEW */}
        {gameState === 'playing' && currentQuestion && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* PROGRESS & STATS */}
            <div className="grid grid-cols-3 gap-2 mb-4 items-center">
              <div className="text-left font-mono text-xs text-black font-black uppercase">
                QUESTION <span className="text-[#8A2BE2] font-black">{currentIndex + 1}</span> OF 10
              </div>
              <div className="text-center font-mono text-base text-black font-black uppercase">
                SCORE: <span className="text-[#8A2BE2]">{score}</span>
              </div>
              <div className="text-right flex items-center justify-end gap-1">
                {streak > 0 && (
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: [1.2, 1], opacity: 1 }}
                    className="flex items-center gap-0.5 bg-[#FF1493] text-white border-2 border-black px-2.5 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Flame className="w-3 h-3 fill-current animate-bounce" />
                    <span>X{streak}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-black h-4 border-4 border-black overflow-hidden mb-5">
              <motion.div 
                className="bg-[#00FA9A] h-full"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentIndex) / 10) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* CATEGORY TAG */}
            <div className="mb-2">
              <span className="text-xs font-black bg-[#FFD700] text-black border-2 border-black px-3 py-1 uppercase tracking-wider inline-block mb-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {currentQuestion.category}
              </span>
            </div>

            {/* QUESTION */}
            <div className="bg-white border-6 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-5 min-h-[100px] flex items-center justify-center">
              <h3 className="font-sans font-black text-black text-lg md:text-xl text-center leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            {/* OPTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
              {currentQuestion.options.map((option, idx) => {
                // Determine styling based on selected & answered states
                let btnStyle = 'border-4 border-black text-black bg-white hover:bg-[#FFFDF0] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all';
                let iconElement = null;

                if (isAnswered) {
                  if (idx === currentQuestion.answer) {
                    // Correct answer (green)
                    btnStyle = 'border-4 border-black bg-[#00FA9A] text-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
                    iconElement = <Check className="w-5 h-5 text-black shrink-0 font-black stroke-[3px]" />;
                  } else if (idx === selectedIdx) {
                    // Wrong answer chosen by user (red)
                    btnStyle = 'border-4 border-black bg-[#FF1493] text-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
                    iconElement = <X className="w-5 h-5 text-white shrink-0 font-black stroke-[3px]" />;
                  } else {
                    // Non-chosen incorrect answers
                    btnStyle = 'border-4 border-neutral-300 bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-60';
                  }
                }

                return (
                  <motion.button
                    id={`quiz-option-${idx}`}
                    key={idx}
                    whileHover={!isAnswered ? { y: -2 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={isAnswered}
                    className={`flex items-center justify-between p-4 rounded-none text-left text-sm md:text-base duration-200 cursor-pointer ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {iconElement}
                  </motion.button>
                );
              })}
            </div>

            {/* EXPLANATION & PROGRESS CONTROLS */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#FFFFD0] border-4 border-black p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-black mb-1 uppercase tracking-wide">
                      <BookOpen className="w-4 h-4 text-black" /> DID YOU KNOW?
                    </div>
                    <p className="text-xs text-black font-bold leading-normal">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                  
                  <motion.button
                    id="quiz-next-btn"
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="w-full md:w-auto shrink-0 bg-[#8A2BE2] text-white border-4 border-black font-black uppercase text-xs py-2.5 px-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all hover:brightness-105 flex items-center justify-center gap-1.5"
                  >
                    {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* RESULTS VIEW */}
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
              Quiz Finished!
            </h3>
            <span className="text-xs bg-[#FF1493] text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {getResultsBadge().title}
            </span>

            <p className="text-center text-xs text-black font-bold max-w-sm mb-6 leading-normal">
              {getResultsBadge().desc}
            </p>

            {/* PERFORMANCE BANNER BENTO */}
            <div className="grid grid-cols-2 gap-3.5 w-full max-w-md mb-6">
              <div className="bg-[#FFEEFF] p-3 border-4 border-black text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[9px] text-black font-mono font-black uppercase">ACCURACY</span>
                <span className="text-2xl font-black text-[#FF1493] leading-none block my-1">
                  {correctCount}/10
                </span>
                <span className="block text-[9px] text-black/70 font-mono font-bold">
                  ({Math.round((correctCount / 10) * 100)}%)
                </span>
              </div>
              <div className="bg-[#EEFFFF] p-3 border-4 border-black text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[9px] text-black font-mono font-black uppercase">FINAL SCORE</span>
                <span className="text-2xl font-black text-emerald-600 leading-none block my-1">
                  {score} PTS
                </span>
                <span className="block text-[9px] text-black/70 font-mono font-bold animate-pulse">
                  BEST: {Math.max(score, currentHighScore)}
                </span>
              </div>
            </div>

            {/* MAX STREAK SUBTEXT */}
            {maxStreak > 1 && (
              <div className="flex items-center gap-1.5 bg-[#FFFFD0] border-4 border-black text-black text-xs px-3.5 py-2 mb-6 font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Flame className="w-4 h-4 fill-current animate-pulse text-[#FF1493]" />
                Highest Streak: {maxStreak} correct answers in a row!
              </div>
            )}

            {/* CONTROLS */}
            <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-xs">
              <motion.button
                id="quiz-retry-btn"
                whileTap={{ scale: 0.95 }}
                onClick={startQuiz}
                className="flex-1 bg-[#00FA9A] hover:bg-emerald-300 text-black border-4 border-black font-black uppercase tracking-wider py-3.5 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <RefreshCw className="w-4 h-4 stroke-[3px]" /> Play Again
              </motion.button>
              <motion.button
                id="quiz-back-menu-btn"
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
