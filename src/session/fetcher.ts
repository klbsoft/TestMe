import { defaultSetting } from "../components/theme/default";
import { AssignmentType, SpeakingPhase, type AssignmentSession } from "./UserSession";
// dev-globals.ts
export const CONFIG_TEST = { foo: 1, bar: "hello" };

if (import.meta.env.DEV) {
  (globalThis as unknown as { CONFIG_TEST: typeof CONFIG_TEST }).CONFIG_TEST = CONFIG_TEST;
}

export function fetchAssigmentSession():AssignmentSession{
      const imagePath = `${defaultSetting.base_bank}test/`;
      const audioPath = `${defaultSetting.base_audio}`;
      // const dialogA = `${audioPath}test.mp3`;//`${audioPath}full-section-a.mp3`;
      // const dialogB = `${audioPath}test.mp3`;//`${audioPath}full-section-b.mp3`;
      
      const dialogA =  `${audioPath}full-section-a.mp3`;
      const dialogB =  `${audioPath}full-section-b.mp3`;
    
      return {
        id: "session_001",
        user: "user_123",
        assignment: {
          id: "assign_001",
          type: AssignmentType.speaking,
          grade: null,
          units: [
            {
              id: "dialog_a",
              phase: SpeakingPhase.describe_image,
              content: `${dialogA}`,
              helpful_sentence: `
    In this section, you will describe what you see in an image.
    
    You will have a few seconds to look at the image before the timer starts. 
     
    Once the timer begins, you will have a limited amount of time to record your answer.
    
    After each question, you can pause and take a breath. But stay alert, because the entire assignment has a time limit.
    
    When you are ready, press the start button to begin.
              `,
              answer: null,
              grade: null,
            },
            {
              id: "unit_001",
              phase: SpeakingPhase.describe_image,
              content: `${imagePath}0.png`,
              helpful_sentence: `Arizona has a beautiful landscapes such
    as: mountains, deserts, and deep canyons.`,
              answer: null,
              grade: null,
            },
            {
              id: "unit_002",
              phase: SpeakingPhase.describe_image,
              content: `${imagePath}1.png`,
              helpful_sentence: `The southern part of our state has an arid
    climate where it rarely rains.`,
              answer: null,
              grade: null,
            },
            {
              id: "unit_003",
              phase: SpeakingPhase.describe_image,
              content: `${imagePath}2.png`,
              helpful_sentence: `Tourists travel from all over the world to look
    at the amazing scenery in Sedona`,
              answer: null,
              grade: null,
            },
            {
              id: "unit_004",
              phase: SpeakingPhase.describe_image,
              content: `${imagePath}3.png`,
              helpful_sentence: `The Grand Canyon has giant cliffs where the
    Native Americans used to live!`,
              answer: null,
              grade: null,
            },
            {
              id: "unit_005",
              phase: SpeakingPhase.describe_image,
              content: `${imagePath}4.png`,
              helpful_sentence: `Northern Arizona has lush forest and
    beautiful saguaro cactus.`,
              answer: null,
              grade: null,
            },
            {
              id: "dialog_b",
              phase: SpeakingPhase.repeat_audio,
              content: `${dialogB}`,
              helpful_sentence: `
              In this section, you will listen to an audio and repeat what you hear.
             
              After you press start, you will hear a sound. Listen carefully, then repeat it as clearly as you can when you see the listening icon.
              
              Once you finish, press next to hear the next audio.
              `,
              answer: null,
              grade: null,
            },
            {
              id: "unit_006",
              phase: SpeakingPhase.repeat_audio,
              content: `${audioPath}5.mp3`,
              answer: null,
              grade: null,
            },
            {
              id: "unit_007",
              phase: SpeakingPhase.repeat_audio,
              content: `${audioPath}6.mp3`,
              answer: null,
              grade: null,
            },
            {
              id: "unit_008",
              phase: SpeakingPhase.repeat_audio,
              content: `${audioPath}7.mp3`,
              answer: null,
              grade: null,
            },
            {
              id: "unit_009",
              phase: SpeakingPhase.repeat_audio,
              content: `${audioPath}8.mp3`,
              answer: null,
              grade: null,
            },
            {
              id: "unit_010",
              phase: SpeakingPhase.repeat_audio,
              content: `${audioPath}9.mp3`,
              answer: null,
              grade: null,
            },
          ],
        },
      };
}