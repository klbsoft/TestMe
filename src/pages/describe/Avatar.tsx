import { useState } from "react";
import Message from "./Message";
import { defaultSetting } from "../../components/theme/default";

export default function Avatar(){
    const [bot, setBot] = useState<string>(`${defaultSetting.base_bot}bot.svg`);
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "12px",
        }}>
            <Message/>
            <img 
                src={bot}
                width={"120px"}
                height={"120px"}
                style={{ marginTop: "10px" }}
            />
        </div>
    )
}