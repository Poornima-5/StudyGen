export interface NoteData {
  id: string;
  title: string;
  content: string;
  style: 'bullet' | 'detailed' | 'condensed';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  sourceType: 'file' | 'text';
  originalFileName?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
}

export interface MCQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface QuizResult {
  id: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; selectedAnswer: number; correct: boolean; }[];
  completedAt: Date;
}