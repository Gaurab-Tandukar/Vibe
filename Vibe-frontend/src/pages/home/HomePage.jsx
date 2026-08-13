import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import Hero from "./component/Hero";
import heroBg from "../../assets/Hero-img.jpg";
import HeroNavBtn from "./component/HeroNavBtn";
import FloatingMessages from "./component/FloatingMessage";

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <>
      <Hero backgroundImage={heroBg}>
        <Navbar />

        {/*
          Positioned near the phone in the background image. Adjust
          anchorBottom/anchorLeft to line up with your actual artwork -
          these are percentages of the Hero section, which is the nearest
          "position: relative" ancestor.
        */}
        <FloatingMessages anchorBottom="40%" anchorLeft="62%" />

        <div
          className="container text-white"
          style={{ paddingTop: "6rem", paddingBottom: "6rem" }}
        >
          <h1 className="display-4 fw-bold">Stay in the vibe.</h1>
          <p className="lead" style={{ maxWidth: "480px" }}>
            Message your friends, anywhere, anytime.
          </p>
          <div className="d-flex gap-2 mt-4">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-outline-light">
              Log in
            </Link>
          </div>
        </div>
        <div
          className="d-flex justify-content-center gap-5"
          style={{
            position: "absolute",
            bottom: "2rem",
            left: 0,
            right: 0,
          }}
        >
          <HeroNavBtn to="#features">Explore Features</HeroNavBtn>
          <HeroNavBtn to="#contact">Contact Us</HeroNavBtn>
        </div>
      </Hero>

      <div className="container py-5">
        <div className="card mt-4" style={{ maxWidth: "500px" }}>
          <div className="card-body">
            <h5 className="card-title">Auth status (testing)</h5>
            {isAuthenticated ? (
              <>
                <p className="mb-1">
                  Logged in as <strong>{user?.username}</strong>
                </p>
                <p className="text-muted small mb-3">
                  {user?.firstName} {user?.lastName} — {user?.email}
                </p>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={logout}
                >
                  Log out
                </button>
              </>
            ) : (
              <p className="text-muted mb-0">Not logged in.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
