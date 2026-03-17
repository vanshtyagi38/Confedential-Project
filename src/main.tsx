import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Security: Console deterrent
if (typeof window !== "undefined") {
  const warningStyle = "color:#e11d48;font-size:32px;font-weight:bold;";
  const msgStyle = "color:#fff;font-size:16px;";
  console.log("%c⛔ Stop!", warningStyle);
  console.log(
    "%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your SingleTape account.",
    msgStyle
  );
  console.log("%cSee https://singletape.in/terms for more information.", msgStyle);
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
