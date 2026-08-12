import MessageBubble from "./MessageBubble";

const DEFAULT_MESSAGES = [
  { text: "missed you!", size: "sm", color: "#1b4332", offsetX: 0, offsetY: 0 },
  {
    text: "how's everything?",
    size: "md",
    color: "#2d6a4f",
    offsetX: 70,
    offsetY: 40,
  },
  {
    text: "coffee this weekend?",
    size: "md",
    color: "#40916c",
    offsetX: -30,
    offsetY: 85,
  },
  {
    text: "I'm down 😄",
    size: "lg",
    color: "#74c69d",
    offsetX: 55,
    offsetY: 130,
  },
];

/**
 * Positions several MessageBubble instances at the same general area,
 * staggered in time AND spaced apart in position (offsetX/offsetY per
 * message), so they read as a scattered stream rather than one column
 * of overlapping bubbles.
 *
 * anchorBottom / anchorLeft: where the stream starts, as % of the parent
 * (the parent must have position: relative/absolute - e.g. your Hero section).
 * Tune these two values to line up with the phone in your background image.
 */
export default function FloatingMessages({
  className = "vibe-floating-messages",
  messages = DEFAULT_MESSAGES,
  anchorBottom = "20%",
  anchorLeft = "58%",
  duration = 7,
}) {
  const gap = duration / messages.length;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        bottom: anchorBottom,
        left: anchorLeft,
        width: "10px",
        height: "10px",
      }}
    >
      {messages.map((m, i) => (
        <MessageBubble
          key={i}
          message={m.text}
          size={m.size}
          color={m.color}
          delay={i * gap}
          duration={duration}
          style={{
            left: `${m.offsetX}px`,
            bottom: `${m.offsetY}px`,
          }}
        />
      ))}
    </div>
  );
}
