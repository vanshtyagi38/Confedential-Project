import { useEffect } from "react";

export function useDisableDevTools() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable common dev tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / Cmd+Opt+I (Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J / Cmd+Opt+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C / Cmd+Opt+C (Element picker)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        return false;
      }
      // Ctrl+U / Cmd+U (View source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
