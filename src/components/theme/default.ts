// commonStyles.ts
export type CommonStyles = {
  text_font_size: string;
  text_font_weight: string;
  button_fontSize: string;
  button_fontWeight: string;
  white:string;
  purple:string;
  clear_purple:string;
  faded_purple:string; 
};

export type Setting = {
  api_url: string; 
  base_path:string; 
  base_imgs:string; 
  base_icons:string; 
  base_bank:string; 
  base_bot:string; 
  base_audio:string;
  base_dialogs:string; 
  initial_count_down:number;
  analize_picture_timer:number; 
  answer_picture_timer:number; 
  think_about_listening:number; 
};
const base = "/testme/";
export const defaultSetting: Setting = {
  api_url: `/testme-api`,
  initial_count_down: 60, // 60
  analize_picture_timer:1, // 20
  answer_picture_timer: 4,  // 45
  think_about_listening:5, // 20
  base_path: base,
  base_imgs:`${base}imgs/`,
  base_icons: `${base}imgs/icons/`,
  base_bank: `${base}imgs/bank/`,
  base_bot: `${base}imgs/bot/`,
  base_audio: `${base}audio/`,
  base_dialogs: `${base}audio/dialogs/`
};

export const commonStyles: CommonStyles = {
  text_font_size: "clamp(16px, 2.5vw, 24px)",
  text_font_weight: "400",
  button_fontSize: "clamp(16px, 2vw, 24px)", 
  button_fontWeight: "500",
  white:"#ffffff",
  purple: "#aa3bff",
  clear_purple:"#c084fc",
  faded_purple:"#c084fc80",
};



let _token = "";

export function setToken(token: string) {
  _token = token;
}

export function getToken(): string {
  return _token;
}

export function clearToken() {
  _token = "";
}