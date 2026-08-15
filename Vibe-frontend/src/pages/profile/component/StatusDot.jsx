/* Status indicator dot */
export default function StatusDot({ status }) {
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
        width: "18px",
        height: "18px",
        backgroundColor: current.color,
        border: "3.5px solid #fff",
        bottom: "5px",
        right: "5px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
      }}
    />
  );
}
