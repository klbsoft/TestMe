// UserSession.ts

export enum AssignmentType {
  speaking = "speaking",
  listening = "listening",
  writing = "writing",
}

export enum SpeakingPhase {
  describe_image = "describe_image",
  repeat_audio = "repeat_audio",
}

export interface UserInfo {
  code: string; 
  password: string;
  teacher: string;
  assignments: Assignment[];
}

export interface SpeakingUnit {
  id: string;
  phase: SpeakingPhase;
  content: any; // For describe_image: image url | For repeat_audio: audio url
  helpful_sentence?: string; // Only for describe_image phase
  answer: any; // Audio blob from student
  grade: string | null;
  thinking_time: number; 
  speaking_time: number; 
}


export interface SpeakingAssignment {
  id: string;
  type: AssignmentType.speaking;
  grade: string | null;
  units: SpeakingUnit[];
}

export interface ListeningAssignment {
  id: string;
  type: AssignmentType.listening;
  grade: string | null;
  // units: ListeningUnit[]
}

export interface WritingAssignment {
  id: string;
  type: AssignmentType.writing;
  grade: string | null;
  // units: WritingUnit[]
}

export type Assignment = SpeakingAssignment | ListeningAssignment | WritingAssignment;

export interface AssignmentSession {
  id: string;
  user: string;
  assignment: Assignment;
}

 

export interface AssignmentState {
  session: AssignmentSession;
  unitIndex: number;
  answer_state:number; 
  timer_current: number;
  timer_started: number; 
  timeElapsed: number;
  maxTimePerAnswer: number;
  maxSessionTime: number;
  is_recording: boolean;
  answer_saved: boolean; 
  completed: boolean; 
  label_message: string;
  audio_file: string;
  isPlaying: boolean; 
  isTicking: boolean;
  isListening: boolean; 
  message_note: string; 
}

// 0
// 


export interface UserLogin{
  code: string; 
  password: string; 
}