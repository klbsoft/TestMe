  import { Image } from "react-bootstrap";
  import { useState, type ReactNode } from "react";
  import { useView } from "../../context/ViewContext";
  import Alerts from "../../pages/alerts/Alerts"  
  // import Home from "../../pages/home/Home";
import { commonStyles, defaultSetting } from "../theme/default";
import Menu from "../menu/Menu";
import Home from "../../pages/home/Home";
import { useFooter } from "../../context/FooterContext";
import "../../animation.css"
function Header() {
        const [prev_view, setPrevView] = useState<ReactNode>(<Home/>);
        const [notification,setNotification] = useState(false);
        const [back_btn_enabled,setBackBtn] = useState(false); 
        const [notification_on_view,setNotificationView] = useState(false);
        const [is_menu_open, setMenu] = useState(false);
        const { currentView,setCurrentView} = useView();
        const {setEnabled,setDefault,leftBorder,rightBorder} = useFooter();
    function onSelected(){
        setMenu(false); 
        setBackBtn(true);
    }
    return (
      <>
  <div 
  className="page-transition"

  style={{ 
  // maxWidth: "1200px", // Expand for PC
  width: "100%",
  flexShrink: 0,
  backgroundColor: commonStyles.purple,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "60px", // Slightly taller for better proportions
  padding: "0 10px",
  boxSizing: "border-box"
    }}>

         <Image
            src={`${defaultSetting.base_icons}${is_menu_open||back_btn_enabled?"wback.png":"wmenu.png"}`} 
              //lime_menu.png"
            // src={`/img/${notification==false?"wbell.png":"wbell_active.png"}`} 
            alt="Notifications" 
            style={{ 
              // default
              height: "38px",
              width: "38px",

              /*
              // condition based 
              height: "30px",
              width: "30px",
              cursor: "pointer",
              padding:"2px",
              border: "1px solid white"  
              */
              padding:"1px",

              // border: "1px solid white"  

              
              // position: "absolute",
              // top: "40%",
              // right: "2px",
              // transform: "translateY(-50%)",
              // height: "38px",
              // width: "38px",            
              // borderRad  ius: "25%",
              // backgroundColor: "black"
            }}
            onClick={() => {

              setDefault();
              // if currentView.type == 
              if (back_btn_enabled){
                  setCurrentView(<Home/>);
                  setEnabled(true);
                  setBackBtn(false); 
                  setNotificationView(false); 
                  setMenu(false);
               
                return;
              }
              if (!is_menu_open){
                 if (!notification_on_view)setPrevView(currentView);
                 setEnabled(false);
                 setCurrentView(<Menu onSelected={onSelected}  />);
              }
              if (is_menu_open){
                setCurrentView(prev_view);
                setEnabled(true);
              }
              setNotificationView(false);
              setMenu(is_menu_open?false:true); 
            }}
            // onDoubleClick={()=>{setNotification(notification?false:true)}}
          />
        <Image
        src={`${defaultSetting.base_icons}${notification_on_view ? "white_home.png" : "white_home.png"}`}
        alt="Notifications"
        style={{ 
          height: "32px",
          width: "32px",
          cursor: "pointer",
          display:"none",

        }}
        onClick={() => {
          setDefault();
          setBackBtn(false);
          setMenu(false); 
          setNotificationView(false); 
          setEnabled(true); 
          setPrevView(<Home/>)
          setCurrentView(<Home/>);  
        }}
        // onDoubleClick={() => { setNotification(!notification) }}
      />  
      <Image
        src={`${defaultSetting.base_icons}${notification_on_view ? "wbell.png" : "wbell.png"}`}
        alt="Notifications"
        style={{ 
          height: "32px",
          width: "32px",
          cursor: "pointer",
          display:"none",
        }}
        onClick={() => {
              setDefault();
              if (!notification_on_view){
                if (!is_menu_open) setPrevView(currentView);
                setCurrentView(<Alerts />);
              }
              // if (notification_on_view){
              //   setCurrentView(prev_view);
              //   onFooterToggle(true);
              // }
              setMenu(false); 
              setEnabled(false);
              setBackBtn(true);
              //setNotificationView(notification_on_view?false:true);
            
          
        }}
        // onDoubleClick={() => { setNotification(!notification) }}
      />
      </div>  
      </>
    );
  }
  
  export default Header;
