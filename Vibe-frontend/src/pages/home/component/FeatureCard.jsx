// `icon` accepts any React element — pass a <FontAwesomeIcon icon={faXyz} /> here
export default function FeatureCard({ icon, iconBg, title, description }) {
  return (
    <div
      className="feature-card h-100 d-flex flex-column align-items-start gap-3 p-4"
      style={{
        border: "1px solid #DAD6C3",
        borderRadius: "16px",
        backgroundColor: "#FFFFFF",
        transition: "border-color 0.25s ease",
      }}
    >
      <div
        className="feature-icon d-flex align-items-center justify-content-center"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          backgroundColor: iconBg,
          color: "#292524",
        }}
      >
        {icon}
      </div>
      <div>
        <h3
          className="feature-title mb-2"
          style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1F2937" }}
        >
          {title}
        </h3>
        <p
          className="feature-description mb-0"
          style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#6B7280" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
