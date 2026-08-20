import { useNavigate } from "react-router-dom";
import doodlePattern from "../../assets/doodle-pattern.svg";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100 p-3 overflow-hidden position-relative"
      style={{
        backgroundColor: "#eef3ea",
        backgroundImage: `url(${doodlePattern})`,
        backgroundRepeat: "repeat",
        backgroundSize: "320px 320px",
      }}
    >
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animated-404 {
          animation: float 3.5s ease-in-out infinite;
        }
      `}</style>

      <div
        className="card border-0 shadow-sm rounded-4 p-4 text-center bg-white position-relative"
        style={{ maxWidth: 440, width: "100%", zIndex: 1 }}
      >
        <div className="card-body p-2">
          {/* Animated Doodle / Icon */}
          <div className="animated-404 mb-3 text-success">
            <i className="bi bi-chat-left-dots-fill fs-1 opacity-75" style={{ fontSize: "4rem" }} />
          </div>

          <h1
            className="fw-bold text-dark mb-1"
            style={{ fontSize: "3.5rem", letterSpacing: "-1px" }}
          >
            404
          </h1>

          <h5 className="fw-semibold text-dark mb-2">Page Not Found</h5>

          <p className="text-muted small mb-4" style={{ fontSize: "0.9rem" }}>
            The conversation, link, or path you are looking for doesn't exist or was moved.
          </p>

          {/* Action Buttons */}
          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-light border rounded-pill px-4 btn-sm fw-semibold text-secondary d-flex align-items-center justify-content-center gap-2"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left" />
              Go Back
            </button>

            <button
              type="button"
              className="btn btn-success rounded-pill px-4 btn-sm fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
              onClick={() => navigate("/")}
            >
              <i className="bi bi-house-door-fill" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}