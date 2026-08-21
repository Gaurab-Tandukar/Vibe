import { useEffect, useState } from "react";
import "../css/Loader.css";

export default function Loader({
  messages = [
    "Watering the roots...",
    "Letting things take root...",
    "Sprouting new pixels...",
    "Steeping a fresh batch of mint...",
    "Almost in full bloom...",
  ],
  messageInterval = 1800,
  useIcon = false,
}) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (messages.length <= 1) return;
    const cycle = setInterval(() => {
      setFade(false);
      const swap = setTimeout(() => {
        setMsgIndex((i) => (i + 1) % messages.length);
        setFade(true);
      }, 250);
      return () => clearTimeout(swap);
    }, messageInterval);
    return () => clearInterval(cycle);
  }, [messages, messageInterval]);

  return (
    <div className="pl-root">
      {useIcon ? (
        <i
          className="fa-solid fa-spinner fa-spin pl-spinner-icon"
          aria-hidden="true"
        />
      ) : (
        <div className="pl-spinner" role="status" aria-label="Loading" />
      )}

      <p className={`pl-message ${fade ? "pl-fade-in" : "pl-fade-out"}`}>
        {messages[msgIndex]}
      </p>
    </div>
  );
}
