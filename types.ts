
export interface Exercise {
  id: string;
  question: string;
  answer: string;
  explanation: string;
}

export interface AiGeneratedContent {
  summary: string;
  keyPoints: string[];
  exercises: Exercise[];
}

export interface Lesson {
  id: string;
  title: string;
  date: string;
  transcription: string;
  images: string[]; // Base64 strings
  aiData?: AiGeneratedContent;
}

export type AppView = 
  | 'TOP' 
  | 'UPLOAD' 
  | 'LIST' 
  | 'SUMMARY' 
  | 'EXERCISE' 
  | 'EXPLANATION' 
  | 'FINISH';

export interface AppState {
  view: AppView;
  currentLessonId: string | null;
  currentExerciseIndex: number;
  lessons: Lesson[];
  isGenerating: boolean;
}
