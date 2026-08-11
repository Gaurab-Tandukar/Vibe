import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <h1>Vibe — Home (testing page)</h1>

        <div className="card mt-4" style={{ maxWidth: "500px" }}>
          <div className="card-body">
            <h5 className="card-title">Auth status</h5>
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

        <div className="d-flex gap-2 mt-4">
          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Go to Register
          </Link>
          <Link to="/profile" className="btn btn-outline-primary">
            Go to Profile (protected)
          </Link>
        </div>
      </div>
    </>
  );
}
