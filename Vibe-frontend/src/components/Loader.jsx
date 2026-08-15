import { useEffect, useState } from "react";
import "./css/Loader.css";

/**
 * Loader — Sage / RootMint themed
 * Full-screen, centered loading overlay: a plain spinner (track in the
 * theme's soft border color, active arc in the accent green) plus a
 * cycling status line underneath. No card, no logo, no dots.
 *
 * Uses your theme's CSS variables (--sage-*) when they're already defined
 * on the page, with matching fallbacks so it still looks right on its own.
 *
 * Requires Font Awesome to be loaded on the page (you already have it) —
 * set `useIcon` to false to fall back to a pure CSS spinner instead.
 *
 * Props:
 *  - messages: array   (status lines that cycle underneath)
 *  - messageInterval: number (ms between message changes, default 1800)
 *  - useIcon: bool      (use Font Awesome fa-spinner instead of CSS ring, default true)
 */
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
