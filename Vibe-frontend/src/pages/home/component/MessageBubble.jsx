import "./css/MessageBubble.css";

const SIZES = {
  sm: { fontSize: "0.8rem", padding: "0.4rem 0.85rem", maxWidth: "150px" },
  md: { fontSize: "0.9rem", padding: "0.55rem 1rem", maxWidth: "200px" },
  lg: { fontSize: "1rem", padding: "0.7rem 1.2rem", maxWidth: "250px" },
};

/**
 * A single animated chat bubble.
 *
 * Props:
 * - message: string - the text to display (required)
 * - color: bubble background color
 * - size: "sm" | "md" | "lg" - controls font size and max width
 * - delay: seconds before this bubble's animation starts (for staggering multiple bubbles)
 * - duration: seconds the full float/fade cycle takes
 * - style: extra positioning styles (left/top/bottom etc), merged in last so it can override defaults
 */
export default function MessageBubble({
  message,
  color = "#40916c",
  size = "md",
  delay = 0,
  duration = 7,
  style = {},
}) {
  const sizeStyles = SIZES[size] ?? SIZES.md;

  return (
    <div
      className="vibe-message-bubble"
      style={{
        backgroundColor: color,
        color: "#ffffff",
        fontWeight: 500,
        lineHeight: 1.3,
        borderRadius: "18px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        ...sizeStyles,
        ...style,
      }}
    >
      {message}
      <span
        className="vibe-message-bubble-tail"
        style={{ borderTopColor: color }}
      />
    </div>
  );
}
