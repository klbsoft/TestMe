import { defaultSetting, commonStyles } from "../../components/theme/default";
import { useState, useEffect } from "react";
import ProgressBar from "./ProgressBar";

export default function Image(){
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isBlurred, setIsBlurred] = useState(true);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isDesktop = windowWidth > 400;

    return (
        <div style={{
            width: "100%",
            display: "flex",
            justifyContent: isDesktop ? "flex-end" : "center",
            paddingRight: isDesktop ? "20%" : "0",
        }}
        onClick={()=>{
            setIsBlurred(isBlurred?false:true);
        }}
        >
            <div style={{
                width: "80%",
                maxWidth: "600px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
            }}>
                <img 
                    src={`${defaultSetting.base_bank}0.jpg`}
                    style={{
                        width: "80%",
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                        border: `solid 2px ${commonStyles.white}`,
                        borderRadius: "22px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                        filter: isBlurred ? "blur(8px)" : "blur(0px)",
                        transition: "filter 0.5s ease-in-out",
                        WebkitTransition: "filter 0.5s ease-in-out",
                        MozTransition: "filter 0.5s ease-in-out",
                    }}
                />
                {/* <button
                    onClick={() => setIsBlurred(!isBlurred)}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: commonStyles.purple,
                        color: commonStyles.white,
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: commonStyles.button_fontSize,
                        fontWeight: commonStyles.button_fontWeight,
                    }}
                >
                    {isBlurred ? "Show Image" : "Hide Image"}
                </button> */}
                <ProgressBar/>
            </div>
        </div>
    )
}