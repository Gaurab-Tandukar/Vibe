export default function StatusDot({
  status,
  size = 12, // Default width/height in px
  bottom = -2, // Offset value (negative moves it outside)
  right = -2, // Offset value (negative moves it outside)
  borderColor = "var(--sbd-rail, #1e1f22)", // Matches sidebar background
}) {
  const map = {
    online: { color: "#22c55e", label: "Online" },
    away: { color: "#eab308", label: "Away" },
    offline: { color: "#94a3b8", label: "Offline" },
  };

  const current = map[status] || map.offline;

  return (
    <span
      title={current.label}
      className="position-absolute d-inline-block rounded-circle"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: current.color,
        border: `2px solid ${borderColor}`,
        bottom: `${bottom}px`,
        right: `${right}px`,
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)",
        zIndex: 2,
      }}
    />
  );
}
