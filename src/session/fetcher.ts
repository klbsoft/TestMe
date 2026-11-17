import { defaultSetting } from "../components/theme/default";
import { AssignmentType, SpeakingPhase, type AssignmentSession } from "./UserSession";

export function fetchAssigmentSession(): AssignmentSession {
  const imagePath = `${defaultSetting.base_bank}test/`;
  const audioPath = `${defaultSetting.base_audio}`;

  const dialogA = `${audioPath}full-section-a.mp3`;
  const dialogB = `${audioPath}full-section-b.mp3`;

  return {
    id: "session_001",
    user: "user_123",
    assignment: {
      id: "assign_001",
      type: AssignmentType.speaking,
      grade: null,
      units: [
        {
          id: "dialog_0",
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
          thinking_time:25, //25,
          speaking_time:45//45,
        },
        {
          id: "unit_1",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}0.png`,
          helpful_sentence: `Arizona has a beautiful landscapes such
    as: mountains, deserts, and deep canyons.`,
          answer: null,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45//45,
        },
        {
          id: "unit_2",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}1.png`,
          helpful_sentence: `The southern part of our state has an arid
    climate where it rarely rains.`,
          answer: null,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45//45,
        },
        {
          id: "unit_3",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}2.png`,
          helpful_sentence: `Tourists travel from all over the world to look
    at the amazing scenery in Sedona`,
          answer: null,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45,//25,
        },
        {
          id: "unit_4",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}3.png`,
          helpful_sentence: `The Grand Canyon has giant cliffs where the
    Native Americans used to live!`,
          answer: null,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45,//25,
        },
        {
          id: "unit_5",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}4.png`,
          helpful_sentence: `Northern Arizona has lush forest and
    beautiful saguaro cactus.`,
          answer: null,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45,//25,
        },
        {
          id: "dialog_1",
          phase: SpeakingPhase.repeat_audio,
          content: `${dialogB}`,
          helpful_sentence: `
              In this section, you will listen to an audio and repeat what you hear.
             
              After you press start, you will hear a sound. Listen carefully, then repeat it as clearly as you can when you see the listening icon.
              
              Once you finish, press next to hear the next audio.
              `,
          answer: null,
          grade: null,
          thinking_time: 5,
          speaking_time: 45,
        },
        {
          id: "unit_6",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}5.mp3`,
          answer: null,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
        {
          id: "unit_7",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}6.mp3`,
          answer: null,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
        {
          id: "unit_8",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}7.mp3`,
          answer: null,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
        {
          id: "unit_9",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}8.mp3`,
          answer: null,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
        {
          id: "unit_10",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}9.mp3`,
          answer: null,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
      ],
    },
  };
}




export function fetchResults(): AssignmentSession {
  const imagePath = `${defaultSetting.base_bank}test/`;
  const audioPath = `${defaultSetting.base_audio}`;

  const dialogA = `${audioPath}full-section-a.mp3`;
  const dialogB = `${audioPath}full-section-b.mp3`;

  return {
    id: "session_001",
    user: "user_123",
    assignment: {
      id: "assign_001",
      type: AssignmentType.speaking,
      grade: null,
      units: [
        {
          id: "dialog_0",
          phase: SpeakingPhase.describe_image,
          content: `${dialogA}`,
          helpful_sentence: `
    In this section, you will describe what you see in an image.
    
    You will have a few seconds to look at the image before the timer starts. 
     
    Once the timer begins, you will have a limited amount of time to record your answer.
    
    After each question, you can pause and take a breath. But stay alert, because the entire assignment has a time limit.
    
    When you are ready, press the start button to begin.
              `,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time:25, //25,
          speaking_time:45//45,
        },
        {
          id: "unit_1",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}0.png`,
          helpful_sentence: `Arizona has a beautiful landscapes such
    as: mountains, deserts, and deep canyons.`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45//45,
        },
        {
          id: "unit_2",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}1.png`,
          helpful_sentence: `The southern part of our state has an arid
    climate where it rarely rains.`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45//45,
        },
        {
          id: "unit_3",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}2.png`,
          helpful_sentence: `Tourists travel from all over the world to look
    at the amazing scenery in Sedona`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45,//25,
        },
        {
          id: "unit_4",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}3.png`,
          helpful_sentence: `The Grand Canyon has giant cliffs where the
    Native Americans used to live!`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45,//25,
        },
        {
          id: "unit_5",
          phase: SpeakingPhase.describe_image,
          content: `${imagePath}4.png`,
          helpful_sentence: `Northern Arizona has lush forest and
    beautiful saguaro cactus.`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 25,//25,
          speaking_time: 45,//25,
        },
        {
          id: "dialog_1",
          phase: SpeakingPhase.repeat_audio,
          content: `${dialogB}`,
          helpful_sentence: `
              In this section, you will listen to an audio and repeat what you hear.
             
              After you press start, you will hear a sound. Listen carefully, then repeat it as clearly as you can when you see the listening icon.
              
              Once you finish, press next to hear the next audio.
              `,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 5,
          speaking_time: 45,
        },
        {
          id: "unit_6",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}5.mp3`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
        {
          id: "unit_7",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}6.mp3`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
        {
          id: "unit_8",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}7.mp3`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
        {
          id: "unit_9",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}8.mp3`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
        {
          id: "unit_10",
          phase: SpeakingPhase.repeat_audio,
          content: `${audioPath}9.mp3`,
          answer: `${audioPath}test.mp3`,
          grade: null,
          thinking_time: 3,
          speaking_time: 10,
        },
      ],
    },
  };
}