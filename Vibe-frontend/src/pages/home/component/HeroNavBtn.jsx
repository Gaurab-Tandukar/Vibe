import "./css/HeroNavBtn.css";

export default function HeroNavBtn({ to, children }) {
  const handleClick = (e) => {
    e.preventDefault();

    const element = document.querySelector(to);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className="d-inline-flex align-items-center gap-1 text-white text-decoration-none fw-semibold vibe-hero-nav-btn"
      style={{
        fontSize: "0.95rem",
        // Text-shadow keeps it readable regardless of what's directly behind
        // it in the image, without needing a background pill/box.
        textShadow: "0 1px 6px rgba(0,0,0,0.6)",
      }}
    >
      {children}
      <i className="bi bi-chevron-down" style={{ fontSize: "0.8rem" }}></i>
    </a>
  );
}
