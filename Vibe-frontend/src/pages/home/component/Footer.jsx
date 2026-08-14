import { Link } from "react-router-dom";
import FooterImg from "../../../assets/vibe-footer-img.jpeg";
import "./css/Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      {/* CTA panel with illustration */}
      <div
        className="footer-hero d-flex align-items-center"
        style={{ backgroundImage: `url(${FooterImg})` }}
      >
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <h2 className="footer-heading">
                Ready to join <br /> the conversation?
              </h2>
              <p className="footer-subtext">
                Sign up in seconds — no credit card, no pressure. See why your
                friends can't stop chatting on Vibe.
              </p>
              <div className="d-flex gap-3 mt-4">
                <Link
                  to="/register"
                  className="btn btn-primary btn-lg rounded-pill px-4"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ground-colored footer bar */}
      <div className="footer-bottom">
        <div className="container">
          <div className="row gy-4 py-4">
            <div className="col-md-4">
              <h5 className="text-white fw-bold mb-2">Vibe</h5>
              <p className="text-white-75 small mb-3" style={{ maxWidth: 260 }}>
                Stay in the vibe. Message the people who matter, anywhere,
                anytime.
              </p>
              <div className="d-flex gap-3 fs-5">
                <a href="#" className="footer-icon" aria-label="Instagram">
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a href="#" className="footer-icon" aria-label="X">
                  <i className="fa-brands fa-x-twitter"></i>
                </a>
                <a href="#" className="footer-icon" aria-label="LinkedIn">
                  <i className="fa-brands fa-linkedin"></i>
                </a>
                <a href="#" className="footer-icon" aria-label="YouTube">
                  <i className="fa-brands fa-youtube"></i>
                </a>
                <a href="#" className="footer-icon" aria-label="TikTok">
                  <i className="fa-brands fa-tiktok"></i>
                </a>
                <a href="#" className="footer-icon" aria-label="Telegram">
                  <i className="fa-brands fa-telegram"></i>
                </a>
              </div>
            </div>

            <div className="col-6 col-md-2">
              <h6 className="text-white fw-semibold mb-3">Product</h6>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li>
                  <a href="#features" className="footer-link">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="footer-link">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="footer-link">
                    Reviews
                  </a>
                </li>
                <li>
                  <Link to="/pricing" className="footer-link">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-6 col-md-3">
              <h6 className="text-white fw-semibold mb-3">Company</h6>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li>
                  <Link to="/about" className="footer-link">
                    Why Us
                  </Link>
                </li>
                <li>
                  <Link to="/approach" className="footer-link">
                    Our Approach
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="footer-link">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-md-3">
              <h6 className="text-white fw-semibold mb-3">Legal</h6>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li>
                  <Link to="/terms" className="footer-link">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="footer-link">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <hr className="border-light opacity-25 my-0" />

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center py-3 gap-2">
            <span className="text-white-75 small">
              &copy; {new Date().getFullYear()} Vibe. All rights reserved.
            </span>
            <span className="text-white-75 small">
              Designed &amp; Developed by{" "}
              <a href="#" className="footer-link">
                Gaurab Tandukar
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
