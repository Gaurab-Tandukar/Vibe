import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useRef } from "react";
import teamMember1 from "../../assets/team-gaurab.jpg";
import teamMember2 from "../../assets/team-dilip.jpg";
import "./css/About.css";
import Footer from "../../components/Footer";

const team = [
  {
    name: "Gaurab Tandukar",
    role: "Founder & Full stack Engineer",
    image: teamMember1,
    color: "arch-yellow",
  },
  {
    name: "Dilip Shrestha",
    role: "Co-Founder & UI/UX Engineer",
    image: teamMember2,
    color: "arch-blue",
  },
];

export default function About() {
  const nextSectionRef = useRef(null);

  const scrollToNext = () => {
    nextSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Navbar />
      <section className="about-section">
        <div className="container">
          <div className="row align-items-center justify-content-center g-4">
            {/* Left member */}
            <div className="col-6 col-md-3 order-1">
              <div className={`arch-shape ${team[0].color}`}>
                <img src={team[0].image} alt={team[0].name} />
              </div>
              <div className="team-caption">
                <h6 className="mb-0">{team[0].name}</h6>
                <span className="text-muted small">{team[0].role}</span>
              </div>
            </div>

            {/* Center content */}
            <div className="col-12 col-md-5 order-3 order-md-2 text-center">
              <span className="about-eyebrow">About Us</span>
              <h2 className="about-title">Meet the Team</h2>
              <p className="about-text">
                Two builders, one obsession — making conversations feel
                effortless. We design, ship, and sweat every detail so Vibe just
                works.
              </p>
              <button
                className="scroll-down-btn"
                onClick={scrollToNext}
                aria-label="Scroll to learn more"
              >
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
            </div>

            {/* Right member */}
            <div className="col-6 col-md-3 order-2 order-md-3">
              <div className={`arch-shape ${team[1].color}`}>
                <img src={team[1].image} alt={team[1].name} />
              </div>
              <div className="team-caption">
                <h6 className="mb-0">{team[1].name}</h6>
                <span className="text-muted small">{team[1].role}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content revealed on scroll-down click */}
      <section ref={nextSectionRef} className="about-story-section">
        <div className="container py-5">
          <div className="row g-4">
            <div className="col-lg-6">
              <h3 className="fw-bold mb-3">Our Story</h3>
              <p className="text-muted">
                Vibe started as a weekend project between two friends frustrated
                with clunky messaging apps. What began as a simple prototype
                grew into a platform built around one idea: staying connected
                should feel natural, fast, and fun — not like a chore.
              </p>
              <p className="text-muted">
                Today, we're focused on building features that actually matter
                to you: real-time messaging, thoughtful design, and privacy you
                can trust.
              </p>
            </div>
            <div className="col-lg-6">
              <div className="row g-3">
                <div className="col-6">
                  <div className="stat-box">
                    <h4 className="fw-bold mb-0">10K+</h4>
                    <span className="text-muted small">Active Users</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-box">
                    <h4 className="fw-bold mb-0">99.9%</h4>
                    <span className="text-muted small">Uptime</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-box">
                    <h4 className="fw-bold mb-0">2</h4>
                    <span className="text-muted small">Founders</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-box">
                    <h4 className="fw-bold mb-0">24/7</h4>
                    <span className="text-muted small">Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
