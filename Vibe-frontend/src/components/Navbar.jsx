import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import vibeLogo from "../assets/vibe-logo.png";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark shadow-sm"
      style={{
        backgroundColor: "#444444",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        paddingTop: "0.35rem",
        paddingBottom: "0.35rem",
        overflow: "visible",
      }}
    >
      <div className="container" style={{ overflow: "visible" }}>
        <Link
          className="navbar-brand fw-bold d-flex align-items-center"
          to="/"
          style={{ overflow: "visible" }}
        >
          <img
            src={vibeLogo}
            alt="Vibe Logo"
            style={{
              height: "96px",
              marginTop: "-15px",
              marginBottom: "-24px",
              marginRight: "8px",
            }}
          />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#navbarOffcanvas"
          aria-controls="navbarOffcanvas"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="offcanvas offcanvas-end text-bg-dark offcanvas-lg w-50"
          tabIndex="-1"
          id="navbarOffcanvas"
          aria-labelledby="navbarOffcanvasLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="navbarOffcanvasLabel">
              Vibe
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="offcanvas"
              data-bs-target="#navbarOffcanvas"
              aria-label="Close"
            ></button>
          </div>

          {/*
            "d-flex flex-column h-100" on mobile: nav links sit at the top,
            and "mt-auto" on the buttons wrapper pushes it all the way to the
            bottom of the panel. On desktop (lg+), "d-lg-flex" + "flex-lg-row"
            below overrides this back to a normal inline row, matching the
            rest of the navbar.
          */}
          <div className="offcanvas-body d-flex flex-column flex-lg-row h-100 h-lg-auto align-items-lg-center justify-content-lg-between">
            <ul className="navbar-nav flex-grow-1 justify-content-center gap-3 mb-3 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/" end>
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/about">
                  About Us
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/contact">
                  Contact Us
                </NavLink>
              </li>
              {isAuthenticated && (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/profile">
                    Profile
                  </NavLink>
                </li>
              )}
            </ul>

            {/*
              Mobile: stacked, full-width buttons pinned to the bottom (d-grid + mt-auto).
              Desktop (lg+): back to a normal inline row next to the nav links.
            */}
            <div className="d-grid gap-2 d-lg-flex align-items-lg-center mt-auto mt-lg-0">
              {isAuthenticated ? (
                <>
                  <span className="navbar-text mb-2 mb-lg-0 me-lg-2 text-center">
                    Hi, {user?.username}
                  </span>
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline-light btn-sm">
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-light btn-sm"
                    style={{
                      backgroundColor: "var(--vibe-highlight)",
                      borderColor: "var(--vibe-highlight)",
                    }}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
