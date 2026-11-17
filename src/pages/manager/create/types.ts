export type Phase = "describe_image" | "repeat_audio";

export interface DraftUnit {
  id: string;
  phase: Phase;
  content: string;
  contentFile?: File;
  contentPreview?: string;
  helpful_sentence?: string;
  answer: string;
  grade: null;
  thinking_time: number;
  speaking_time: number;
}
export type AssignmentKind = "speaking" | "listening" | "writing";

export const makeDialog = (phase: Phase, index: number): DraftUnit => ({
  id: `dialog_${index+1}`,
  phase,
  content: "",
  helpful_sentence: "",
  answer: "",
  grade: null,
  thinking_time: phase === "describe_image" ? 25 : 5,
  speaking_time: 45,
});

export const makeUnit = (phase: Phase, index: number): DraftUnit => ({
  id: `unit_${index+1}`,
  phase,
  content: "",
  helpful_sentence: phase === "describe_image" ? "" : undefined,
  answer: "",
  grade: null,
  thinking_time: phase === "describe_image" ? 25 : 3,
  speaking_time: phase === "describe_image" ? 45 : 10,
});

export const initialState = (): DraftUnit[] => [
  makeDialog("describe_image", 0),
  ...[1, 2, 3, 4, 5].map((n) => makeUnit("describe_image", n)),
  makeDialog("repeat_audio", 1),
  ...[6, 7, 8, 9, 10].map((n) => makeUnit("repeat_audio", n)),
];