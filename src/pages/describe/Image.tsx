import { defaultSetting, commonStyles } from "../../components/theme/default";
import { useState, useEffect } from "react";
import ProgressBar from "./ProgressBar";

export default function Image(){
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
        }}>
            <div style={{
                width: "80%",
                maxWidth: "600px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
            }}>
                <img 
                    src={`${defaultSetting.base_bank}view.jpg`}
                    style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                    }}
                />
                <ProgressBar/>
            </div>
        </div>
    )
}