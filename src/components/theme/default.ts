// commonStyles.ts
export type CommonStyles = {
  text_font_size: string;
  text_font_weight: string;
  button_fontSize: string;
  button_fontWeight: string;
  green:string;
  blue:string;
  white:string;
  purple:string;
  clear_purple:string;
  faded_purple:string; 
};

export type Setting = {
  base_path:string; 
  base_icons:string; 
  base_bank:string; 
  base_bot:string; 
};
 
export const defaultSetting: Setting = {
  base_path: "/testme/",
  base_icons: "/testme/imgs/icons/",
  base_bank: "/testme/imgs/bank/",
  base_bot: "/testme/imgs/bot/"
}
export const commonStyles: CommonStyles = {
text_font_size: "clamp(16px, 2.5vw, 24px)", // 16px
  text_font_weight: "400",
  button_fontSize: "clamp(16px, 2vw, 18px)", // 18px
  button_fontWeight: "500",
  green:"#6CC24A",
  blue:"#0367C7",
  white:"#ffffff",
  purple: "#aa3bff",
  clear_purple:"#c084fc",
  faded_purple:"#c084fc80",
};