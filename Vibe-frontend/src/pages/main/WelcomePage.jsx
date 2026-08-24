import { useNavigate } from "react-router-dom";
import Logo from "../../assets/vibe-icon.png";

export default function WelcomePage() {
  const navigate = useNavigate();

  const handleStartConversation = () => {
    const isMobile = window.innerWidth <= 991;

    // Mobile/tablet: open the sidebar first so the user can see the transition
    if (isMobile) {
      window.dispatchEvent(new Event("vibe:open-sidebar"));
    }

    // Dispatch an event to open the New Direct Message modal directly
    window.dispatchEvent(new Event("vibe:open-new-dm"));
  };

  return (
    <div className="flex-grow-1 d-flex flex-column justify-content-between h-100 p-4 p-md-5">
      {/* Mobile-only top bar with menu access — otherwise there is no way to
          reach the sidebar on mobile until a chat is already open */}
      <div className="d-flex d-lg-none align-items-center gap-2 mb-3">
        <button
          type="button"
          className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary shadow-sm"
          style={{ width: 36, height: 36 }}
          title="Open menu"
          onClick={() => window.dispatchEvent(new Event("vibe:open-sidebar"))}
        >
          <i className="bi bi-list" style={{ fontSize: "1.1rem" }} />
        </button>
        <span className="fw-bold text-dark">Vibe</span>
      </div>

      {/* Header/Hero Section */}
      <div
        className="text-center mx-auto my-auto py-5"
        style={{ maxWidth: "640px" }}
      >
        <img
          src={Logo}
          alt="Vibe Logo"
          className="mb-4"
          style={{ width: "80px", height: "80px", objectFit: "cover" }}
        />
        <h1 className="fw-bold text-dark mb-3">Welcome to Vibe</h1>
        <p className="text-muted fs-5 mb-4">
          Connect with friends, team members, and communities in real time.
          Choose an option below to jump straight in.
        </p>

        <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
          <button
            className="btn btn-primary btn-lg rounded-pill px-4 shadow-sm"
            style={{ backgroundColor: "#52c98a", borderColor: "#52c98a" }}
            onClick={handleStartConversation}
          >
            <i className="bi bi-chat-plus-fill me-2"></i>
            Start a Conversation
          </button>
          <button
            className="btn btn-outline-secondary btn-lg rounded-pill px-4"
            onClick={() => navigate("/profile")}
          >
            <i className="bi bi-person-circle me-2"></i>
            View Profile
          </button>
        </div>

        {/* Quick Action Cards */}
        <div className="row g-3 text-start">
          <div className="col-12 col-md-4">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center mb-2">
                <div
                  className="rounded-3 p-2 text-white me-3"
                  style={{ backgroundColor: "#52c98a" }}
                >
                  <i className="bi bi-people-fill fs-4"></i>
                </div>
                <h6 className="fw-bold mb-0">Direct Messages</h6>
              </div>
              <p className="small text-muted mb-0">
                Select any friend from your sidebar list to start a 1-on-1
                private chat.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center mb-2">
                <div
                  className="rounded-3 p-2 text-white me-3"
                  style={{ backgroundColor: "#1c1d21" }}
                >
                  <i className="bi bi-hash fs-4"></i>
                </div>
                <h6 className="fw-bold mb-0">Group Channels</h6>
              </div>
              <p className="small text-muted mb-0">
                Click on the group icons on the far-left rail to switch between
                servers and teams.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center mb-2">
                <div
                  className="rounded-3 p-2 text-white me-3"
                  style={{ backgroundColor: "#3b82f6" }}
                >
                  <i className="bi bi-layout-split fs-4"></i>
                </div>
                <h6 className="fw-bold mb-0">Split Tab View</h6>
              </div>
              <p className="small text-muted mb-0">
                Work across multiple chats simultaneously using IDE-style
                side-by-side split panels.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-muted small py-2">
        <span>Vibe Web Client</span> &bull; <span>Status: Connected</span>
      </div>
    </div>
  );
}
