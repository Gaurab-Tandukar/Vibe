import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import {
  faShieldHeart,
  faBolt,
  faUsers,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { useRef } from "react";
import teamMember1 from "../../assets/team-gaurab.jpg";
import doodlePattern from "../../assets/doodle-pattern.svg";
import "./css/About.css";
import Footer from "../../components/Footer";

const team = [
  {
    name: "Gaurab Tandukar",
    role: "Founder & Full Stack Engineer",
    image: teamMember1,
    color: "arch-yellow",
  },
];

const values = [
  {
    icon: faShieldHeart,
    title: "Privacy First",
    text: "Your conversations are yours. We build with privacy baked in, not bolted on.",
  },
  {
    icon: faBolt,
    title: "Fast & Reliable",
    text: "Messages that land instantly, every time — no spinners, no waiting.",
  },
  {
    icon: faUsers,
    title: "Built for People",
    text: "Every feature starts with a real conversation we had with real users.",
  },
  {
    icon: faHeart,
    title: "Made with Care",
    text: "We sweat the small stuff because small stuff is what people notice.",
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

      {/* Meet the team */}
      <section
        className="about-section"
        style={{ backgroundImage: `url(${doodlePattern})` }}
      >
        <div className="container">
          <div className="row align-items-center justify-content-center g-5">
            <div className="col-12 col-md-5 text-center text-md-start">
              <span className="about-eyebrow">About Us</span>
              <h2 className="about-title">Meet the Creator</h2>
              <p className="about-text">
                One builder, one obsession — making conversations feel
                effortless and expressive. Designed and crafted with precision so Vibe
                just works seamlessly.
              </p>
              <button
                className="scroll-down-btn mt-2"
                onClick={scrollToNext}
                aria-label="Scroll to learn more"
              >
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
            </div>

            <div className="col-10 col-sm-8 col-md-4 col-lg-3 text-center">
              <div className={`arch-shape ${team[0].color} mx-auto shadow-md`}>
                <img src={team[0].image} alt={team[0].name} />
              </div>
              <div className="team-caption mt-3">
                <h5 className="mb-1 fw-bold text-dark">{team[0].name}</h5>
                <span className="text-muted small fw-medium">{team[0].role}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story + Stats */}
      <section ref={nextSectionRef} className="about-story-section">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <h3 className="fw-bold mb-3">Our Story</h3>
              <p className="text-muted">
                Vibe was born from a desire to create a messaging platform that combines
                the responsiveness of modern web architectures with intuitive, developer-grade
                workspace experiences.
              </p>
              <p className="text-muted">
                Today, Vibe focuses on real-time messaging, end-to-end encryption, HD audio/video
                calling, and dynamic collaboration workspaces.
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
                    <h4 className="fw-bold mb-0">1</h4>
                    <span className="text-muted small">Founder</span>
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

      {/* Our Values */}
      <section className="values-section">
        <div className="container py-5">
          <div className="text-center mb-5">
            <span className="about-eyebrow">What We Stand For</span>
            <h3 className="fw-bold">Our Values</h3>
          </div>
          <div className="row g-4">
            {values.map((v) => (
              <div className="col-6 col-md-3" key={v.title}>
                <div className="value-card text-center h-100">
                  <div className="value-icon">
                    <FontAwesomeIcon icon={v.icon} />
                  </div>
                  <h6 className="fw-bold mt-3 mb-2">{v.title}</h6>
                  <p className="text-muted small mb-0">{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <Footer />
    </>
  );
}
