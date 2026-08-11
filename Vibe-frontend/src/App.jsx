import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const location = useLocation();

  // Safety net: Bootstrap's offcanvas sometimes leaves "overflow: hidden"
  // stuck on <body> if the panel doesn't close cleanly during navigation.
  // Clearing it on every route change guarantees scrolling never stays locked.
  useEffect(() => {
    document.body.style.overflow = "";
    document.body.classList.remove("offcanvas-backdrop");
  }, [location]);

  return <AppRoutes />;
}

export default App;
