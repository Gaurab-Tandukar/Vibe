import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import vibeIcon from "../../assets/vibe-icon.png";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only the home page has a background image behind the navbar,
  // so glass only makes visual sense there. Every other page gets a solid bar.
  const isHome = location.pathname === "/";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="container" style={{ paddingTop: "1rem" }}>
      <nav
        className={`navbar navbar-expand-lg navbar-dark shadow-sm ${
          isHome ? "vibe-glass-nav" : "vibe-solid-nav"
        }`}
        style={{
          borderRadius: "999px",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          overflow: "visible",
          position: "relative",
        }}
      >
        <div className="container-fluid px-2" style={{ overflow: "visible" }}>
          {/* Circular logo badge + wordmark */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "#13070C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src={vibeIcon}
                alt="Vibe"
                style={{ width: "70%", height: "70%", objectFit: "contain" }}
              />
            </div>
            <span
              className="text-white fw-bold ms-2"
              style={{ fontSize: "1.4rem", letterSpacing: "1px" }}
            >
              VIBE
            </span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#navbarOffcanvas"
            aria-controls="navbarOffcanvas"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="offcanvas offcanvas-end offcanvas-lg w-50"
            style={{ backgroundColor: "#0A0A0A" }}
            tabIndex="-1"
            id="navbarOffcanvas"
            aria-labelledby="navbarOffcanvasLabel"
          >
            <div className="offcanvas-header">
              <div className="d-flex align-items-center">
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    backgroundColor: "#000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={vibeIcon}
                    alt="Vibe"
                    style={{
                      width: "70%",
                      height: "70%",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <span
                  className="text-white fw-bold ms-2"
                  style={{ fontSize: "1.2rem", letterSpacing: "1px" }}
                >
                  VIBE
                </span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="offcanvas"
                data-bs-target="#navbarOffcanvas"
                aria-label="Close"
              ></button>
            </div>

            <div className="offcanvas-body d-flex flex-column flex-lg-row h-100 h-lg-auto align-items-lg-center justify-content-lg-between">
              <ul className="navbar-nav mx-lg-auto flex-grow-1 justify-content-start justify-content-lg-center gap-4 gap-lg-4 mb-3 mb-lg-0">
                <li className="nav-item">
                  <NavLink className="nav-link vibe-nav-link" to="/" end>
                    Home
                  </NavLink>
                </li>
                {/* <li className="nav-item">
                  <NavLink className="nav-link vibe-nav-link" to="/feature">
                    Feature
                  </NavLink>
                </li> */}
                <li className="nav-item">
                  <NavLink className="nav-link vibe-nav-link" to="/about">
                    About
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link vibe-nav-link" to="/contact">
                    Contact
                  </NavLink>
                </li>
                {isAuthenticated && (
                  <li className="nav-item">
                    <NavLink className="nav-link vibe-nav-link" to="/profile">
                      Profile
                    </NavLink>
                  </li>
                )}
              </ul>

              <div className="d-grid gap-2 d-lg-flex align-items-lg-center mt-auto mt-lg-0">
                {isAuthenticated ? (
                  <>
                    <span className="navbar-text mb-2 mb-lg-0 me-lg-2 text-center text-white">
                      Hi, {user?.username}
                    </span>
                    <button
                      className="btn btn-sm fw-semibold"
                      style={{
                        backgroundColor: "#1BD975",
                        color: "#000000",
                        borderRadius: "999px",
                        padding: "0.5rem 1.5rem",
                        border: "none",
                      }}
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn btn-sm fw-semibold"
                      style={{
                        backgroundColor: "#1BD975",
                        color: "#000000",
                        borderRadius: "999px",
                        padding: "0.5rem 1.5rem",
                        border: "none",
                      }}
                    >
                      Login
                    </Link>
                    {/* <Link
                      to="/register"
                      className="btn btn-sm fw-semibold"
                      style={{
                        backgroundColor: "transparent",
                        color: "#EDF5E8",
                        border: "1.5px solid rgba(237,245,232,0.4)",
                        borderRadius: "999px",
                        padding: "0.5rem 1.5rem",
                      }}
                    >
                      Sign up
                    </Link> */}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Glass layer lives on a ::before pseudo-element, not the <nav> itself -
          this avoids backdrop-filter turning <nav> into a "containing block"
          that would trap the offcanvas's fixed positioning inside it. */}
      <style>{`
        .vibe-glass-nav {
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .vibe-glass-nav::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background-color: rgba(10, 10, 10, 0.55);
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          z-index: -1;
        }

        .vibe-solid-nav {
          background-color: #0A0A0A;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .vibe-nav-link {
          color: #EDF5E8 !important;
          opacity: 0.75;
          font-weight: 500;
        }
        .vibe-nav-link:hover {
          opacity: 1;
        }
        .vibe-nav-link.active {
          color: #FF7D03 !important;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
