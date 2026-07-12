import { AppContext } from "./AppContext";
import React, { useEffect, useState } from "react";

const AppState = (props) => { 
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Replace with actual auth check
  

  // const loginCheck = () => {

  //   console.log("lllllllllllllllll")
  //   if(localStorage.getItem("token")){
  //     console.log("wwwwww")
  //   setIsAuthenticated(true);
  //   } else{
  //     setIsAuthenticated(false);
  //   }



  // }
  const logoutCheck = () => setIsAuthenticated(false);

 
  return (
    <div>
      <AppContext.Provider
        value={{ isAuthenticated, /* loginCheck, */ logoutCheck,
           }}
      >
        {props.children}
      </AppContext.Provider>
    </div>
  );
}

export default AppState;