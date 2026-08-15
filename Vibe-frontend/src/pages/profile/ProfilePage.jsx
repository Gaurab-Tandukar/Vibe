import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchProfile, getUserByUsername } from "../../api/profileService";
import Loader from "../../components/Loader";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import doodlePattern from "../../assets/doodle-pattern.svg";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();

  const isOwnProfile = !username || username === user?.username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = isOwnProfile
          ? await fetchProfile()
          : await getUserByUsername(username);

        if (cancelled) return;
        setProfile(data);
        if (isOwnProfile) updateUser(data);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(
          err.response?.status === 404
            ? "This user doesn't exist."
            : "Failed to load profile.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnProfile, username]);

  if (loading)
    return <Loader useIcon={false} messages={["Loading profile..."]} />;
  if (error)
    return (
      <div className="container py-5 text-danger text-center">{error}</div>
    );

  const bannerUrl = resolveMediaUrl(profile?.bannerUrl);
  const avatarUrl = resolveMediaUrl(profile?.avatarUrl);
  const fullName =
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  const aboutMe = profile?.aboutMe;
  const badges = profile?.badges || [];
  const connections = profile?.connections || [];
  const roles = profile?.roles || [];
  const activity = profile?.activity;

  return (
    <div
      className="position-relative"
      style={{
        backgroundColor: "#eef3ea",
        backgroundImage: `url(${doodlePattern})`,
        backgroundRepeat: "repeat",
        backgroundSize: "320px 320px",
        minHeight: "100vh",
      }}
    >
      {/* Soft overlay */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{ zIndex: 0 }}
      />

      <button
        type="button"
        className="btn btn-white border rounded-pill shadow-sm d-none d-lg-inline-flex align-items-center gap-2 px-3 py-2 position-fixed"
        style={{
          backgroundColor: "#fff",
          color: "var(--sage-ink, #1b4332)",
          top: "3.5rem",
          left: "2rem",
          zIndex: 2,
        }}
        onClick={() => navigate("/chat")}
      >
        <i className="bi bi-arrow-left"></i>
        Back to chat
      </button>

      <div
        className="container position-relative"
        style={{
          maxWidth: "640px",
          paddingTop: "3.5rem",
          paddingBottom: "4rem",
          zIndex: 1,
        }}
      >
        {/* position-relative here so any absolutely-positioned card
            elements anchor to this card's corner, not the whole page */}
        <div className="card border-0 shadow-sm overflow-hidden bg-white rounded-4 position-relative">
          {/* Banner */}
          <div
            style={{
              height: "150px",
              background: bannerUrl
                ? `url(${bannerUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, #ff7a18, #af002d 70%)",
            }}
          />

          <div className="card-body position-relative pt-5 px-4 pb-4">
            {/* Avatar + Status dot */}
            <div
              className="position-absolute"
              style={{ top: "-48px", left: "28px" }}
            >
              <div
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  border: "4px solid #fff",
                  overflow: "hidden",
                  background: "#e9ecef",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  position: "relative",
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.username}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-secondary fw-bold fs-3">
                    {profile?.firstName?.[0]?.toUpperCase() ||
                      profile?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Status indicator – bottom right of avatar */}
              <StatusDot status={profile?.status} />
            </div>

            {/* Settings gear – own profile only */}
            {isOwnProfile && (
              <button
                className="btn btn-sm btn-light border position-absolute"
                style={{ top: "16px", right: "16px", borderRadius: "50%" }}
                title="Edit profile"
                onClick={() => navigate("/profile/edit")}
              >
                <i className="bi bi-gear-fill"></i>
              </button>
            )}

            {/* Name */}
            <div className="mt-2">
              <h4 className="mb-0 fw-semibold">
                {fullName || profile?.username}
              </h4>
              <p className="text-secondary mb-2">@{profile?.username}</p>

              {/* Activity */}
              {activity?.label && (
                <p className="text-secondary small mb-2">
                  <i className="bi bi-controller me-1"></i>
                  {activity.label}
                </p>
              )}

              {/* Badges */}
              {badges.length > 0 && (
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  {badges.map((badge, i) => (
                    <span
                      key={i}
                      className="d-inline-flex align-items-center justify-content-center"
                      title={badge.label}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "rgba(64, 145, 108, 0.12)",
                      }}
                    >
                      {badge.icon ? (
                        <i
                          className={badge.icon}
                          style={{ fontSize: "0.85rem" }}
                        ></i>
                      ) : (
                        <span style={{ fontSize: "0.7rem" }}>
                          {badge.label?.[0]}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {profile?.bio && <p className="mb-2">{profile.bio}</p>}

              {/* Roles */}
              {roles.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {roles.map((role, i) => (
                    <span
                      key={i}
                      className="badge bg-light text-secondary border rounded-pill px-3"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}

              {memberSince && (
                <p className="text-secondary small mb-3">
                  Member since {memberSince}
                </p>
              )}

              <hr className="my-3" />

              {/* About Me */}
              <div className="mb-4">
                <p className="text-secondary small text-uppercase fw-semibold mb-1">
                  About Me
                </p>
                {aboutMe ? (
                  <p className="mb-0">{aboutMe}</p>
                ) : isOwnProfile ? (
                  <p className="text-secondary fst-italic mb-0">
                    Click to add an About Me
                  </p>
                ) : null}
              </div>

              {/* Contact – improved look (own profile only) */}
              {isOwnProfile && (
                <div className="mb-4">
                  <p className="text-secondary small text-uppercase fw-semibold mb-3">
                    Contact
                  </p>

                  <div className="d-flex flex-column gap-2">
                    {/* Email */}
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: "36px",
                          height: "36px",
                          background: "#f1f5f9",
                          flexShrink: 0,
                        }}
                      >
                        <i className="bi bi-envelope text-secondary"></i>
                      </div>
                      <div>
                        <div className="text-secondary small">Email</div>
                        <div className="fw-medium">{profile?.email}</div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: "36px",
                          height: "36px",
                          background: "#f1f5f9",
                          flexShrink: 0,
                        }}
                      >
                        <i className="bi bi-telephone text-secondary"></i>
                      </div>
                      <div>
                        <div className="text-secondary small">Phone</div>
                        <div className="fw-medium">
                          {profile?.phoneNumber || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Connections */}
              {connections.length > 0 && (
                <div className="mb-2">
                  <p className="text-secondary small text-uppercase fw-semibold mb-3">
                    Connections
                  </p>
                  <div className="d-flex flex-column gap-2">
                    {connections.map((conn, i) => (
                      <a
                        key={i}
                        href={conn.url}
                        target="_blank"
                        rel="noreferrer"
                        className="d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none"
                        style={{
                          background: "#f8f9fa",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#eef1f4")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#f8f9fa")
                        }
                      >
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle bg-white border"
                          style={{
                            width: "38px",
                            height: "38px",
                            flexShrink: 0,
                          }}
                        >
                          {conn.icon ? (
                            <i
                              className={conn.icon}
                              style={{ fontSize: "1rem" }}
                            ></i>
                          ) : (
                            <i className="bi bi-link-45deg"></i>
                          )}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="text-body fw-medium text-truncate">
                            {conn.name}
                          </div>
                          {conn.url && (
                            <div className="text-secondary small text-truncate">
                              {conn.url.replace(/^https?:\/\//, "")}
                            </div>
                          )}
                        </div>
                        <i className="bi bi-box-arrow-up-right text-secondary small"></i>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Status dot positioned at bottom-right of the avatar */
function StatusDot({ status }) {
  const map = {
    online: { color: "#22c55e", label: "Online" },
    away: { color: "#eab308", label: "Away" },
    offline: { color: "#94a3b8", label: "Offline" },
  };

  const current = map[status] || map.offline;

  return (
    <span
      title={current.label}
      className="position-absolute d-inline-block rounded-circle"
      style={{
        width: "16px",
        height: "16px",
        backgroundColor: current.color,
        border: "3px solid #fff",
        bottom: "2px",
        right: "2px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
    />
  );
}
