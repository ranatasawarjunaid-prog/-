export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number; // Index of the correct option
  category: string;
  explanation: string;
}

export interface TapTarget {
  id: string;
  x: number; // percentage of play area width (0-100)
  y: number; // percentage of play area height (0-100)
  size: number; // px size or abstract scale
  color: string;
  type: 'bonus' | 'normal' | 'trap';
  points: number;
  duration: number; // how long it stays visible (ms)
  createdAt: number; // timestamp
}

export interface MemoryCard {
  id: number;
  pairId: number;
  iconName: string; // name of Lucide icon to display
  isFlipped: boolean;
  isMatched: boolean;
  colorClass: string;
}

export interface HighScores {
  quiz: number;
  tap: number;
  memory: number; // recorded as best moves count (lower is better, or calculated score)
}

export type GameType = 'menu' | 'quiz' | 'tap' | 'memory';
