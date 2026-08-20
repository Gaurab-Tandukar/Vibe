import Navbar from "../../components/Navbar";
import ContactForm from "./component/ContactForm";
import doodlePattern from "../../assets/doodle-pattern.svg";
import Footer from "../../components/Footer";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <div
        className="contact-page-wrapper position-relative py-5"
        style={{
          minHeight: "90vh",
          backgroundImage: `url(${doodlePattern})`,
          backgroundRepeat: "repeat",
          backgroundSize: "320px 320px",
          backgroundColor: "#eef3ea",
        }}
      >
        <div className="container py-4 position-relative" style={{ maxWidth: "1080px", zIndex: 1 }}>
          <div className="text-center mb-5">
            <span
              className="d-inline-block text-uppercase fw-bold small tracking-wider mb-2 px-3 py-1 rounded-pill"
              style={{
                backgroundColor: "rgba(45, 106, 79, 0.12)",
                color: "#1b4332",
                letterSpacing: "0.08em",
              }}
            >
              Support & Community
            </span>
            <h1 className="fw-bold text-dark display-6 mb-3">Let&apos;s Start a Conversation</h1>
            <p className="text-secondary mx-auto mb-0" style={{ maxWidth: "580px", fontSize: "1.05rem" }}>
              Have a question about Vibe, discovered a bug, or want to contribute?
              Our team is here to help you get connected.
            </p>
          </div>

          <div className="row g-4 justify-content-center align-items-stretch">
            {/* Left side info channels */}
            <div className="col-12 col-lg-5 d-flex flex-column justify-content-between">
              <div
                className="card border-0 rounded-4 p-4 shadow-sm h-100 bg-white d-flex flex-column justify-content-between"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div>
                  <h4 className="fw-bold text-dark mb-4">Contact Information</h4>

                  <div className="d-flex flex-column gap-4">
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: "rgba(45, 106, 79, 0.1)",
                          color: "#2d6a4f",
                        }}
                      >
                        <i className="bi bi-envelope-fill fs-5" />
                      </div>
                      <div>
                        <h6 className="fw-semibold text-dark mb-1">Email Us</h6>
                        <a
                          href="mailto:support@vibe.io"
                          className="text-secondary text-decoration-none small"
                        >
                          gaurabtandukar0@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: "rgba(37, 99, 235, 0.1)",
                          color: "#2563eb",
                        }}
                      >
                        <i className="bi bi-geo-alt-fill fs-5" />
                      </div>
                      <div>
                        <h6 className="fw-semibold text-dark mb-1">Headquarters</h6>
                        <p className="text-secondary small mb-0">
                          Kathmandu, Nepal
                        </p>
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: "rgba(234, 179, 8, 0.12)",
                          color: "#d97706",
                        }}
                      >
                        <i className="bi bi-clock-fill fs-5" />
                      </div>
                      <div>
                        <h6 className="fw-semibold text-dark mb-1">Response Time</h6>
                        <p className="text-secondary small mb-0">
                          Typically responds within 24 hours
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-top">
                  <span className="small text-muted d-block mb-2 fw-medium">Connect on Socials</span>
                  <div className="d-flex gap-2">
                    <a
                      href="https://github.com/Gaurab-Tandukar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center border"
                      style={{ width: 36, height: 36 }}
                      title="GitHub"
                    >
                      <i className="bi bi-github" />
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center border"
                      style={{ width: 36, height: 36 }}
                      title="LinkedIn"
                    >
                      <i className="bi bi-linkedin" />
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center border"
                      style={{ width: 36, height: 36 }}
                      title="Twitter / X"
                    >
                      <i className="bi bi-twitter-x" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side form */}
            <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
