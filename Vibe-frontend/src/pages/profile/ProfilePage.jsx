import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchProfile, getUserByUsername } from "../../api/profileService";
import { createConversation } from "../../api/conversationService";
import Loader from "../../components/Loader";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import doodlePattern from "../../assets/doodle-pattern.svg";
import StatusDot from "./component/StatusDot";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();

  const isOwnProfile = !username || username === user?.username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
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

  const taskBadges = useMemo(() => {
    const list = [];

    // Early Adopter badge
    list.push({
      id: "early-adopter",
      label: "Early Adopter",
      desc: "Joined Vibe in the pioneer era",
      icon: "bi-stars",
      color: "#d97706",
      bg: "rgba(245, 158, 11, 0.12)",
    });

    // Profile Pioneer badge
    if (profile?.bio || profile?.aboutMe || profile?.avatarUrl) {
      list.push({
        id: "profile-pioneer",
        label: "Profile Pioneer",
        desc: "Customized full bio & avatar",
        icon: "bi-person-check-fill",
        color: "#2563eb",
        bg: "rgba(37, 99, 235, 0.12)",
      });
    }

    // Social Connector badge
    if (
      (profile?.connections && profile.connections.length > 0) ||
      (profile?.tags && profile.tags.length > 0)
    ) {
      list.push({
        id: "social-connector",
        label: "Social Connector",
        desc: "Linked social profiles and interests",
        icon: "bi-link-45deg",
        color: "#059669",
        bg: "rgba(5, 150, 105, 0.12)",
      });
    }

    // Vibe Verified badge
    list.push({
      id: "vibe-verified",
      label: "Vibe Verified",
      desc: "Authenticated active community member",
      icon: "bi-patch-check-fill",
      color: "#0891b2",
      bg: "rgba(8, 145, 178, 0.12)",
    });

    return list;
  }, [profile]);

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
  const tags = profile?.tags || [];
  const activity = profile?.activity;

  const handleStartChat = async () => {
    if (!profile?._id) return;
    setStartingChat(true);
    try {
      const conv = await createConversation({
        isGroup: false,
        members: [profile._id],
      });
      navigate("/chat", {
        state: {
          openChat: {
            id: conv._id,
            name: fullName || profile.username,
            avatarUrl: profile.avatarUrl,
            recipientId: profile._id,
            isGroup: false,
          },
        },
      });
    } catch (err) {
      console.error("Failed to start chat from profile:", err);
      navigate("/chat");
    } finally {
      setStartingChat(false);
    }
  };

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

      {/* Back to chat button */}
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
        <div className="card border-0 shadow-sm overflow-hidden bg-white rounded-4 position-relative">
          {/* Banner */}
          <div
            style={{
              height: "150px",
              background: bannerUrl
                ? `url(${bannerUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, #2d6a4f, #1b4332)",
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

              {/* Status indicator */}
              <StatusDot status={profile?.status} />
            </div>

            {/* Action buttons (Settings gear for own profile / Send Message button for other users) */}
            {isOwnProfile ? (
              <button
                className="btn btn-sm btn-light border position-absolute"
                style={{ top: "16px", right: "16px", borderRadius: "50%" }}
                title="Edit profile"
                onClick={() => navigate("/profile/edit")}
              >
                <i className="bi bi-gear-fill"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-success position-absolute d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-sm"
                style={{ top: "16px", right: "16px" }}
                onClick={handleStartChat}
                disabled={startingChat}
              >
                {startingChat ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <>
                    <i className="bi bi-chat-dots-fill me-1" />
                    <span>Message</span>
                  </>
                )}
              </button>
            )}

            {/* Header info: Name & Username */}
            <div className="mt-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="mb-0 fw-semibold">
                  {fullName || profile?.username}
                </h4>
                {/* Vibe verified inline badge */}
                <i className="bi bi-patch-check-fill text-primary" title="Verified User" style={{ fontSize: "1.1rem" }} />
              </div>
              <p className="text-secondary mb-2">@{profile?.username}</p>

              {/* Active Activity Banner */}
              {activity?.label && (
                <div
                  className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-3 mb-3"
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.08)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                    color: "#15803d",
                    fontSize: "0.875rem",
                  }}
                >
                  <i className="bi bi-controller fs-6"></i>
                  <span>
                    <strong className="text-capitalize">
                      {activity.type || "Playing"}:
                    </strong>{" "}
                    {activity.label}
                  </span>
                </div>
              )}

              {/* Task & Achievement Badges */}
              <div className="mb-3">
                <div className="d-flex gap-2 flex-wrap">
                  {taskBadges.map((badge) => (
                    <span
                      key={badge.id}
                      className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill small fw-medium shadow-2xs"
                      title={badge.desc}
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        fontSize: "0.78rem",
                        border: `1px solid ${badge.color}33`,
                      }}
                    >
                      <i className={`bi ${badge.icon}`} style={{ fontSize: "0.85rem" }} />
                      <span>{badge.label}</span>
                    </span>
                  ))}
                  {badges.map((badge, i) => (
                    <span
                      key={`custom-${i}`}
                      className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill small fw-medium"
                      title={badge.label}
                      style={{
                        backgroundColor: "rgba(64, 145, 108, 0.12)",
                        color: "#1b4332",
                        fontSize: "0.78rem",
                      }}
                    >
                      {badge.icon && <i className={`bi ${badge.icon}`} />}
                      <span>{badge.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && <p className="mb-3 text-dark">{profile.bio}</p>}

              {/* Member Since */}
              {memberSince && (
                <p className="d-flex text-secondary small mb-3 gap-1">
                  <i className="bi bi-calendar3 me-2 opacity-75"></i>
                  <span>Member since {memberSince}</span>
                </p>
              )}

              <hr className="my-3 opacity-25" />

              {/* About Me */}
              <div className="mb-4">
                <p className="text-secondary small text-uppercase fw-bold mb-2 tracking-wide">
                  About Me
                </p>
                {aboutMe ? (
                  <p
                    className="mb-0 text-dark"
                    style={{ lineHeight: "1.6", textAlign: "justify" }}
                  >
                    {aboutMe}
                  </p>
                ) : isOwnProfile ? (
                  <p className="text-secondary fst-italic mb-0 small">
                    Click settings above to write your bio.
                  </p>
                ) : null}
              </div>

              {/* Tags Section */}
              {tags.length > 0 && (
                <div className="mb-4">
                  <p className="text-secondary small text-uppercase fw-bold mb-2 tracking-wide">
                    Interests & Skills
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-medium"
                        style={{
                          backgroundColor: "#f0fdf4",
                          color: "#166534",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <i className="bi bi-hash opacity-50"></i>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact (Own Profile Only) */}
              {isOwnProfile && (
                <div className="mb-4">
                  <p className="text-secondary small text-uppercase fw-bold mb-3 tracking-wide">
                    Contact Details
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
                        <div className="fw-medium text-dark">
                          {profile?.email}
                        </div>
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
                        <div className="fw-medium text-dark">
                          {profile?.phoneNumber || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Connections */}
              {connections.length > 0 && (
                <div className="mb-2">
                  <p className="text-secondary small text-uppercase fw-bold mb-3 tracking-wide">
                    Connections
                  </p>
                  <div className="d-flex flex-column gap-2">
                    {connections.map((conn, i) => (
                      <a
                        key={i}
                        href={conn.url}
                        target="_blank"
                        rel="noreferrer"
                        className="d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none border"
                        style={{
                          background: "#fafafa",
                          borderColor: "#e2e8f0",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f1f5f9";
                          e.currentTarget.style.borderColor = "#cbd5e1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fafafa";
                          e.currentTarget.style.borderColor = "#e2e8f0";
                        }}
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
                              style={{ fontSize: "1rem", color: "#334155" }}
                            ></i>
                          ) : (
                            <i className="bi bi-link-45deg text-secondary"></i>
                          )}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="text-dark fw-medium text-truncate">
                            {conn.name || conn.platform}
                          </div>
                          {conn.url && (
                            <div className="text-secondary small text-truncate opacity-75">
                              {conn.url.replace(/^https?:\/\//, "")}
                            </div>
                          )}
                        </div>
                        <i className="bi bi-box-arrow-up-right text-secondary small px-1"></i>
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
