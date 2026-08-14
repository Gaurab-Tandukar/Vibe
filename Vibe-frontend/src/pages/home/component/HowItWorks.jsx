const STEPS = [
  {
    number: 1,
    title: "Account",
    description: "Create your free profile using simple authentication.",
  },
  {
    number: 2,
    title: "Find Friends",
    description: "Search for your team members or invite new ones via email.",
  },
  {
    number: 3,
    title: "Start Chatting",
    description:
      "Open a thread or create a group and start sharing ideas instantly.",
  },
];

export default function HowItWorks() {
  return (
    <section
      className="how-it-works py-5"
      id="how-it-works"
      style={{ backgroundColor: "var(--sage-bg)" }}
    >
      <div className="container" style={{ maxWidth: "1152px" }}>
        <h2
          className="text-center fw-bold mb-5"
          style={{
            fontFamily: "var(--sage-font-heading)",
            color: "var(--sage-ink)",
            fontSize: "2.25rem",
          }}
        >
          Get started in minutes
        </h2>

        <div className="row align-items-start">
          {STEPS.map((step, index) => (
            <div
              className="col-12 col-md-4 position-relative"
              key={step.number}
            >
              {index < STEPS.length - 1 && (
                <div
                  className="d-none d-md-block position-absolute"
                  style={{
                    top: "30px",
                    left: "calc(50% + 60px)",
                    width: "calc(100% - 120px)",
                    height: "1px",
                    backgroundColor: "var(--sage-border)",
                  }}
                />
              )}

              <div className="d-flex flex-column align-items-center text-center px-3">
                <div
                  className="d-flex align-items-center justify-content-center fw-bold mb-3"
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "var(--sage-accent)",
                    color: "var(--sage-surface)",
                    fontFamily: "var(--sage-font-heading)",
                    fontSize: "1.25rem",
                  }}
                >
                  {step.number}
                </div>
                <h3
                  className="fw-bold mb-2"
                  style={{
                    fontFamily: "var(--sage-font-heading)",
                    color: "var(--sage-ink)",
                    fontSize: "1.1rem",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="mb-0"
                  style={{
                    fontFamily: "var(--sage-font-body)",
                    color: "var(--sage-muted)",
                    fontSize: "0.95rem",
                    maxWidth: "260px",
                  }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
