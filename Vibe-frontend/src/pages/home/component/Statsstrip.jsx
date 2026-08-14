const STATS = [
  {
    value: "2M+",
    label: "Active Users",
    description: "Vibrant communities growing every single day.",
  },
  {
    value: "500M+",
    label: "Messages Sent",
    description: "Fueling millions of meaningful conversations.",
  },
  {
    value: "99.9%",
    label: "Uptime",
    description: "Reliable infrastructure that never sleeps.",
  },
];

export default function StatsStrip() {
  return (
    <section
      className="stats-strip py-5"
      style={{ backgroundColor: "var(--sage-bg)" }}
    >
      <div className="container" style={{ maxWidth: "1152px" }}>
        <div className="row g-4">
          {STATS.map((stat) => (
            <div className="col-12 col-md-4" key={stat.label}>
              <div
                className="h-100 text-center px-4 py-5"
                style={{
                  backgroundColor: "var(--sage-surface)",
                  border: "1px solid var(--sage-border)",
                  borderRadius: "16px",
                }}
              >
                <div
                  className="fw-bold mb-2"
                  style={{
                    fontFamily: "var(--sage-font-heading)",
                    color: "var(--sage-accent)",
                    fontSize: "2.5rem",
                  }}
                >
                  {stat.value}
                </div>
                <h3
                  className="fw-bold mb-2"
                  style={{
                    fontFamily: "var(--sage-font-heading)",
                    color: "var(--sage-ink)",
                    fontSize: "1.1rem",
                  }}
                >
                  {stat.label}
                </h3>
                <p
                  className="mb-0"
                  style={{
                    fontFamily: "var(--sage-font-body)",
                    color: "var(--sage-muted)",
                    fontSize: "0.9rem",
                  }}
                >
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
