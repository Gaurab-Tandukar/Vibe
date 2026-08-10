import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="container py-5">
      <h1>Profile</h1>

      <div className="card mt-3" style={{ maxWidth: "500px" }}>
        <div className="card-body">
          <h5 className="card-title mb-3">Your info</h5>

          <p className="mb-1">
            <strong>Username:</strong> {user?.username}
          </p>
          <p className="mb-1">
            <strong>Name:</strong> {user?.firstName} {user?.lastName}
          </p>
          <p className="mb-1">
            <strong>Email:</strong> {user?.email}
          </p>
          <p className="mb-3">
            <strong>Phone:</strong> {user?.phoneNo}
          </p>

          <button className="btn btn-outline-danger" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
