import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { fetchProfile, updateProfile } from "../../api/profileService";
import Loader from "../../components/Loader";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import doodlePattern from "../../assets/doodle-pattern.svg";

export default function EditProfilePage() {
  const { updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    aboutMe: "",
  });

  const [connections, setConnections] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [badges, setBadges] = useState([]); // all badges the user has obtained (read-only, from backend)
  const [selectedBadges, setSelectedBadges] = useState([]); // labels of the badges chosen for display (max 3)
  const [stats, setStats] = useState({
    messagesSent: 0,
    totalChats: 0,
    groupsJoined: 0,
  }); // read-only usage stats, used to compute stat-based achievement badges
  const MAX_DISPLAYED_BADGES = 3;

  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchProfile();
        if (cancelled) return;
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          bio: data.bio || "",
          aboutMe: data.aboutMe || "",
        });
        setConnections(data.connections || []);
        setTags(data.tags || []);
        setBadges(data.badges || []);
        setSelectedBadges(data.selectedBadges || []);
        setStats({
          messagesSent: data.stats?.messagesSent || 0,
          totalChats: data.stats?.totalChats || 0,
          groupsJoined: data.stats?.groupsJoined || 0,
        });
        setAvatarPreview(resolveMediaUrl(data.avatarUrl) || null);
        setBannerPreview(resolveMediaUrl(data.bannerUrl) || null);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleFieldChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleBannerChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function addConnection() {
    setConnections((c) => [
      ...c,
      { platform: "", name: "", url: "", icon: "" },
    ]);
  }

  function updateConnection(index, field, value) {
    setConnections((c) =>
      c.map((conn, i) => (i === index ? { ...conn, [field]: value } : conn)),
    );
  }

  function removeConnection(index) {
    setConnections((c) => c.filter((_, i) => i !== index));
  }

  function addTag() {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) {
      setTagInput("");
      return;
    }
    setTags((t) => [...t, value]);
    setTagInput("");
  }

  function handleTagKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  function removeTag(value) {
    setTags((t) => t.filter((tag) => tag !== value));
  }

  function toggleBadge(label) {
    setSelectedBadges((prev) => {
      if (prev.includes(label)) {
        return prev.filter((l) => l !== label);
      }
      if (prev.length >= MAX_DISPLAYED_BADGES) {
        // Already at the cap — ignore the click instead of exceeding the limit
        return prev;
      }
      return [...prev, label];
    });
  }

  // The auto-earned achievement badges, computed live from the current
  // (possibly unsaved) form state — same rules as on the profile page.
  const taskBadges = useMemo(() => {
    const list = [];

    if (form.bio || form.aboutMe || avatarPreview) {
      list.push({
        label: "Profile Pioneer",
        desc: "Customized full bio & avatar",
        icon: "bi-person-check-fill",
      });
    }

    if (connections.length > 0 || tags.length > 0) {
      list.push({
        label: "Social Connector",
        desc: "Linked social profiles and interests",
        icon: "bi-link-45deg",
      });
    }

    if (stats.messagesSent >= 50) {
      list.push({
        label: "Power Chatter",
        desc: "Sent 50+ messages",
        icon: "bi-chat-dots-fill",
      });
    }

    if (stats.totalChats >= 10) {
      list.push({
        label: "Community Builder",
        desc: "Active in 10+ chats",
        icon: "bi-people-fill",
      });
    }

    if (stats.groupsJoined >= 5) {
      list.push({
        label: "Group Enthusiast",
        desc: "Joined 5+ groups",
        icon: "bi-collection-fill",
      });
    }

    return list;
  }, [form.bio, form.aboutMe, avatarPreview, connections, tags, stats]);

  // Achievement badges + backend-issued badges share the same 3 slots
  const badgePool = useMemo(
    () => [...taskBadges, ...badges],
    [taskBadges, badges],
  );

  // If an achievement badge that was selected is no longer earned (e.g. the
  // user just cleared their bio), drop it from the selection automatically.
  useEffect(() => {
    const eligibleLabels = new Set(badgePool.map((b) => b.label));
    setSelectedBadges((prev) => {
      const next = prev.filter((label) => eligibleLabels.has(label));
      return next.length === prev.length ? prev : next;
    });
  }, [badgePool]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("email", form.email);
      formData.append("bio", form.bio);
      formData.append("aboutMe", form.aboutMe);
      formData.append(
        "connections",
        JSON.stringify(connections.filter((c) => c.name && c.url)),
      );
      formData.append("tags", JSON.stringify(tags));
      formData.append("selectedBadges", JSON.stringify(selectedBadges));

      if (avatarFile) formData.append("avatar", avatarFile);
      if (bannerFile) formData.append("banner", bannerFile);

      const data = await updateProfile(formData);
      updateUser(data);
      showToast("Profile updated successfully", {
        description: "Your changes have been saved to your profile.",
        type: "success",
      });
      navigate("/profile");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to save profile. Try again.";
      setError(msg);
      showToast("Failed to save profile", {
        description: msg,
        type: "error",
      });
      setSaving(false);
    }
  }

  if (loading)
    return <Loader useIcon={false} messages={["Loading your profile..."]} />;

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
      {/* Soft sage overlay */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{ background: "sage--bg", zIndex: 0 }}
      />

      <div
        className="container position-relative py-4"
        style={{ maxWidth: "640px", zIndex: 1 }}
      >
        <form
          onSubmit={handleSubmit}
          className="card border-0 shadow-sm overflow-hidden bg-white rounded-4"
        >
          {/* Banner */}
          <div
            style={{
              height: "160px",
              background: bannerPreview
                ? `url(${bannerPreview}) center/cover no-repeat`
                : "linear-gradient(135deg, #ff7a18, #af002d 70%)",
              position: "relative",
            }}
          >
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="d-none"
              onChange={handleBannerChange}
            />
            <button
              type="button"
              className="btn btn-sm btn-light position-absolute d-flex align-items-center gap-1"
              style={{ bottom: "10px", right: "10px" }}
              onClick={() => bannerInputRef.current?.click()}
            >
              <i className="bi bi-camera-fill"></i> Change banner
            </button>
          </div>

          <div className="card-body position-relative pt-5 px-4 pb-4">
            {/* Avatar */}
            <div
              className="position-absolute"
              style={{ top: "-48px", left: "24px" }}
            >
              <div
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  border: "4px solid white",
                  overflow: "hidden",
                  background: "#e9ecef",
                  position: "relative",
                }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-secondary fw-bold fs-3">
                    {form.firstName?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="d-none"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                className="btn btn-sm btn-light position-absolute"
                style={{
                  bottom: "0",
                  right: "0",
                  borderRadius: "50%",
                  padding: "4px 6px",
                }}
                title="Change avatar"
                onClick={() => avatarInputRef.current?.click()}
              >
                <i
                  className="bi bi-camera-fill"
                  style={{ fontSize: "0.7rem" }}
                ></i>
              </button>
            </div>

            <h4 className="mt-2 mb-4">Edit Profile</h4>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Name */}
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label">First name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  value={form.firstName}
                  onChange={handleFieldChange}
                  maxLength={50}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label">Last name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  value={form.lastName}
                  onChange={handleFieldChange}
                  maxLength={50}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={form.email}
                onChange={handleFieldChange}
                maxLength={100}
                required
              />
            </div>

            {/* Bio */}
            <div className="mb-3">
              <label className="form-label d-flex justify-content-between">
                <span>Bio</span>
                <span className="text-secondary small">
                  {form.bio.length}/200
                </span>
              </label>
              <input
                type="text"
                name="bio"
                className="form-control"
                value={form.bio}
                onChange={handleFieldChange}
                maxLength={200}
                placeholder="A short status line, shown under your name"
              />
            </div>

            {/* About Me */}
            <div className="mb-4">
              <label className="form-label d-flex justify-content-between">
                <span>About Me</span>
                <span className="text-secondary small">
                  {form.aboutMe.length}/500
                </span>
              </label>
              <textarea
                name="aboutMe"
                className="form-control"
                rows={4}
                value={form.aboutMe}
                onChange={handleFieldChange}
                maxLength={500}
                placeholder="Tell people a bit more about yourself"
              />
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="form-label">Tags</label>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="badge bg-light text-secondary border d-flex align-items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      className="btn-close btn-close-sm"
                      style={{ fontSize: "0.55rem" }}
                      aria-label={`Remove ${tag}`}
                      onClick={() => removeTag(tag)}
                    ></button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="Type a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
              />
            </div>

            {/* Edit Badges */}
            <div className="mb-4">
              <label className="form-label d-flex justify-content-between align-items-center">
                <span>Badges</span>
                <span className="text-secondary small">
                  {selectedBadges.length}/{MAX_DISPLAYED_BADGES} selected
                </span>
              </label>

              {badgePool.length > 0 ? (
                <>
                  <p className="text-secondary small mb-2">
                    Choose up to {MAX_DISPLAYED_BADGES} badges to show on your
                    profile.
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    {badgePool.map((badge, i) => {
                      const isSelected = selectedBadges
                        .map((l) => (l || "").trim().toLowerCase())
                        .includes((badge.label || "").trim().toLowerCase());
                      const isDisabled =
                        !isSelected &&
                        selectedBadges.length >= MAX_DISPLAYED_BADGES;
                      return (
                        <button
                          key={`edit-badge-${i}`}
                          type="button"
                          onClick={() => toggleBadge(badge.label)}
                          disabled={isDisabled}
                          title={
                            isDisabled
                              ? `You can only display up to ${MAX_DISPLAYED_BADGES} badges`
                              : badge.desc || badge.label
                          }
                          className="d-inline-flex align-items-center gap-2 px-2.5 py-1 rounded-pill small fw-medium border"
                          style={{
                            fontSize: "0.8rem",
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            backgroundColor: isSelected
                              ? "rgba(64, 145, 108, 0.15)"
                              : "#f8f9fa",
                            color: isSelected ? "#1b4332" : "#495057",
                            borderColor: isSelected
                              ? "rgba(27, 67, 50, 0.3)"
                              : "#dee2e6",
                            opacity: isDisabled ? 0.5 : 1,
                            transition: "all 0.15s ease",
                          }}
                        >
                          {badge.icon && <i className={`bi ${badge.icon}`} />}
                          <span>{badge.label}</span>
                          {isSelected && (
                            <i
                              className="bi bi-check-circle-fill"
                              style={{ fontSize: "0.75rem" }}
                            ></i>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-secondary fst-italic mb-0 small">
                  You haven't earned any badges yet. Keep using the app to
                  unlock some!
                </p>
              )}
            </div>

            {/* Connections */}
            <div className="mb-4">
              <label className="form-label d-block mb-2">Connections</label>
              <div className="d-flex flex-column gap-2 mb-2">
                {connections.map((conn, i) => (
                  <div key={i} className="row g-2 align-items-center">
                    <div className="col-3">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Platform"
                        value={conn.platform}
                        onChange={(e) =>
                          updateConnection(i, "platform", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-3">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Display name"
                        value={conn.name}
                        onChange={(e) =>
                          updateConnection(i, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-5">
                      <input
                        type="url"
                        className="form-control form-control-sm"
                        placeholder="https://..."
                        value={conn.url}
                        onChange={(e) =>
                          updateConnection(i, "url", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-1 text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        title="Remove connection"
                        onClick={() => removeConnection(i)}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addConnection}
              >
                <i className="bi bi-plus-lg me-1"></i> Add connection
              </button>
            </div>

            <hr />

            {/* Footer buttons */}
            <div className="d-flex justify-content-between align-items-center">
              {/* Left side – Logout */}
              <button
                type="button"
                className="btn btn-outline-danger rounded-pill px-4"
                onClick={handleLogout}
                disabled={saving}
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Log out
              </button>

              {/* Right side – Cancel + Save */}
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-light border rounded-pill px-4"
                  onClick={() => navigate(-1)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-4"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}