// UserSession.ts
export enum AssignmentType {
  speaking="speaking"
}

export interface UserInfo {
  id: string;
  group: string;
  teacher: string; 
  password: string;
  assigments: Assigment[]; 
}

export interface Unit{
  id: string; 
  content: any; 
  answer: any; 
  grade: string | null; 
}
 
export interface Assigment{
  id: string; 
  type: AssignmentType;  
  grade: string | null;
  units: Unit[]
}

 

export interface AssignmentSession {
  id: string;
  user: string;
  assigment: Assigment; 
}
