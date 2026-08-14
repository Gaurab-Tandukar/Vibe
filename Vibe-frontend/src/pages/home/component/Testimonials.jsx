import { useEffect, useRef, useState } from "react";

const TESTIMONIALS = [
  {
    quote:
      "Vibe changed how our study group collaborates. The real-time updates are flawlessly fast.",
    name: "Sarah Jenkins",
    role: "Computer Science Student",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    quote:
      "The minimalist design is exactly what I needed. No clutter, just fast, reliable communication.",
    name: "Marcus Thorne",
    role: "UX Designer",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    quote:
      "Easily the best messaging experience on the web today. Clean, fast, and feature-rich.",
    name: "Lila Chen",
    role: "Project Manager",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
  {
    quote:
      "Switched our whole team over in a day. Notifications actually feel instant instead of laggy.",
    name: "Devon Brooks",
    role: "Engineering Lead",
    avatar: "https://i.pravatar.cc/150?img=53",
  },
  {
    quote:
      "Group chats used to be chaos. Vibe's threading keeps every conversation easy to follow.",
    name: "Priya Nair",
    role: "Product Designer",
    avatar: "https://i.pravatar.cc/150?img=25",
  },
];

function Stars() {
  return (
    <div
      className="mb-3"
      style={{ color: "var(--sage-accent)", fontSize: "1rem" }}
    >
      {"★★★★★"}
    </div>
  );
}

const AUTO_ADVANCE_MS = 4000;
const CARD_GAP = 24;

export default function Testimonials() {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollToIndex = (index) => {
    if (!trackRef.current) return;
    const cardWidth = trackRef.current.firstChild?.offsetWidth || 320;
    trackRef.current.scrollTo({
      left: index * (cardWidth + CARD_GAP),
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  // Auto-advance
  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % TESTIMONIALS.length;
        if (trackRef.current) {
          const cardWidth = trackRef.current.firstChild?.offsetWidth || 320;
          trackRef.current.scrollTo({
            left: next * (cardWidth + CARD_GAP),
            behavior: "smooth",
          });
        }
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Keep dots in sync if the user drags/swipes the track manually
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const cardWidth = track.firstChild?.offsetWidth || 320;
        const index = Math.round(track.scrollLeft / (cardWidth + CARD_GAP));
        setActiveIndex(Math.min(index, TESTIMONIALS.length - 1));
      }, 100);
    };
    track.addEventListener("scroll", handleScroll);
    return () => {
      track.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <section
      className="testimonials py-5"
      id="testimonials"
      style={{ backgroundColor: "#eaf2e7" }}
    >
      <div className="container" style={{ maxWidth: "1152px" }}>
        <h2
          className="fw-bold text-center mb-5"
          style={{
            fontFamily: "var(--sage-font-heading)",
            color: "var(--sage-ink)",
            fontSize: "2.25rem",
          }}
        >
          Loved by students and professionals
        </h2>

        <div
          ref={trackRef}
          className="d-flex gap-4 pb-3"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
          }}
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="testimonial-card flex-shrink-0 p-4"
              style={{
                width: "320px",
                scrollSnapAlign: "start",
                backgroundColor: "var(--sage-surface)",
                border: "1px solid var(--sage-border)",
                borderRadius: "16px",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.04)";
                e.currentTarget.style.boxShadow =
                  "0 12px 24px rgba(27, 67, 50, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Stars />
              <p
                className="mb-4"
                style={{
                  fontFamily: "var(--sage-font-body)",
                  color: "var(--sage-body)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                  minHeight: "84px",
                }}
              >
                "{t.quote}"
              </p>
              <div className="d-flex align-items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  width="44"
                  height="44"
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <div
                    className="fw-bold"
                    style={{
                      fontFamily: "var(--sage-font-heading)",
                      color: "var(--sage-ink)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--sage-font-body)",
                      color: "var(--sage-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-center gap-2 mt-4">
          {TESTIMONIALS.map((t, index) => (
            <button
              key={t.name}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              aria-current={activeIndex === index}
              className="border-0 p-0"
              style={{
                width: activeIndex === index ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                backgroundColor:
                  activeIndex === index
                    ? "var(--sage-accent)"
                    : "var(--sage-border)",
                cursor: "pointer",
                transition: "width 0.25s ease, background-color 0.25s ease",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
