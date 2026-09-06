import { defaultSetting, commonStyles } from "../../components/theme/default";
import { useState, useEffect } from "react";
import ProgressBar from "./ProgressBar";

interface ImageProps {
  windowHeight: number;
}

export default function Image({ windowHeight }: ImageProps){
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isBlurred, setIsBlurred] = useState(true);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isDesktop = windowWidth > 800;
    
    // Calculate max size based on viewport height
    const maxImageSize = Math.min(
        isDesktop ? 600 : 400,
        windowHeight * 0.6 // 60% of viewport height
    );

    return (
        <div style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }}
        onClick={() => {
            setIsBlurred(isBlurred ? false : true);
        }}
        >
            <div style={{
                width: "100%",
                maxWidth: maxImageSize,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "center",
            }}>
                <img 
                    src={`${defaultSetting.base_bank}0.jpg`}
                    style={{
                        width: "100%",
                        maxWidth: maxImageSize,
                        maxHeight: maxImageSize,
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
                <ProgressBar/>
            </div>
        </div>
    )
}