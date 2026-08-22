import { useState } from "react";
import { resolveMediaUrl } from "../../utils/MediaURL";
import {
  updateGroup,
  transferAdmin,
  setMemberNickname,
} from "../../api/conversationService";
import { getUserDisplayName } from "../sidebar/Sidebarhelpers";
import ConfirmModal from "../ui/ConfirmModal";
import { useToast } from "../../context/ToastContext";
import "../css/EditGroup.css";

const EditGroupModal = ({
  show,
  onClose,
  group,
  members,
  isAdmin,
  currentUserId,
  onGroupUpdated,
  onMembersRefresh,
  onAdminTransferred,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const [nameDraft, setNameDraft] = useState(group?.name || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    resolveMediaUrl(group?.avatarUrl) || "",
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [newAdminId, setNewAdminId] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  const [nicknameDrafts, setNicknameDrafts] = useState({});
  const [savingNicknameFor, setSavingNicknameFor] = useState(null);
  const [nicknameError, setNicknameError] = useState("");
  const [prevKey, setPrevKey] = useState({ show, groupId: group?._id });

  if (show !== prevKey.show || group?._id !== prevKey.groupId) {
    setPrevKey({ show, groupId: group?._id });

    if (show) {
      setNameDraft(group?.name || "");
      setAvatarPreview(resolveMediaUrl(group?.avatarUrl) || "");
      setAvatarFile(null);
      setProfileSaved(false);
      setProfileError("");
      setTransferError("");
      setNewAdminId("");
      setNicknameError("");
      setShowTransferConfirm(false);

      const initialDrafts = {};
      (members || []).forEach((m) => {
        if (m.user?._id) {
          initialDrafts[m.user._id] = m.nickname || "";
        }
      });
      setNicknameDrafts(initialDrafts);
    }
  }

  if (!show) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setProfileSaved(false);
  };

  const handleSaveProfile = async () => {
    const trimmedName = nameDraft.trim();
    if (!trimmedName) {
      setProfileError("Group name cannot be empty.");
      return;
    }
    setSavingProfile(true);
    setProfileError("");
    try {
      const updated = await updateGroup(group._id, {
        name: trimmedName,
        avatarFile,
      });
      if (onGroupUpdated) onGroupUpdated(updated);
      setAvatarFile(null);
      setProfileSaved(true);
      showToast("Group profile updated", { type: "success" });
    } catch (err) {
      console.error("Failed to update group:", err?.response?.data || err);
      setProfileError(
        err?.response?.data?.message || "Couldn't update group profile.",
      );
      showToast("Failed to update group profile", { type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const otherMembers = (members || []).filter(
    (m) => String(m.user?._id) !== String(currentUserId),
  );

  const handleTransferClick = () => {
    if (!newAdminId) {
      setTransferError("Please pick a member to transfer ownership to.");
      return;
    }
    setShowTransferConfirm(true);
  };

  const executeTransfer = async () => {
    setShowTransferConfirm(false);
    setTransferring(true);
    setTransferError("");
    try {
      await transferAdmin(group._id, newAdminId);
      if (onAdminTransferred) onAdminTransferred();
      if (onMembersRefresh) await onMembersRefresh();
      showToast("Admin ownership transferred", { type: "success" });
      onClose();
    } catch (err) {
      console.error("Failed to transfer admin:", err?.response?.data || err);
      setTransferError(
        err?.response?.data?.message || "Couldn't transfer admin role.",
      );
      showToast("Failed to transfer admin role", { type: "error" });
    } finally {
      setTransferring(false);
    }
  };

  const handleSaveNickname = async (userId) => {
    setSavingNicknameFor(userId);
    setNicknameError("");
    try {
      await setMemberNickname(group._id, userId, nicknameDrafts[userId] || "");
      if (onMembersRefresh) await onMembersRefresh();
    } catch (err) {
      console.error("Failed to set nickname:", err?.response?.data || err);
      setNicknameError(
        err?.response?.data?.message || "Couldn't update nickname.",
      );
    } finally {
      setSavingNicknameFor(null);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content shadow-lg"
          style={{
            backgroundColor: "var(--sbd-panel)",
            border: "1px solid var(--sbd-border)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="modal-header px-4 py-3"
            style={{ borderBottom: "1px solid var(--sbd-border)" }}
          >
            <h6
              className="modal-title fw-semibold mb-0"
              style={{ color: "var(--sbd-text)", fontSize: "1.05rem" }}
            >
              Group Settings
            </h6>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div
            className="modal-body p-4"
            style={{ maxHeight: "72vh", overflowY: "auto" }}
          >
            {/* Tab Navigation */}
            <div className="sbd-modal-tabs">
              <button
                type="button"
                className={`sbd-modal-tab ${activeTab === "general" ? "active" : ""}`}
                onClick={() => setActiveTab("general")}
              >
                Overview
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className={`sbd-modal-tab ${activeTab === "nicknames" ? "active" : ""}`}
                  onClick={() => setActiveTab("nicknames")}
                >
                  Nicknames
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  className={`sbd-modal-tab ${activeTab === "admin" ? "active" : ""}`}
                  onClick={() => setActiveTab("admin")}
                >
                  Permissions
                </button>
              )}
            </div>

            {/* TAB 1: GENERAL / OVERVIEW */}
            {activeTab === "general" && (
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3">
                  <label
                    htmlFor="group-avatar-input"
                    className="sbd-avatar-picker flex-shrink-0"
                    title="Change group photo"
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Group avatar"
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <span
                        className="w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-white"
                        style={{
                          backgroundColor: "var(--sbd-accent)",
                          fontSize: "1.5rem",
                        }}
                      >
                        {(group?.name || "#").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="sbd-avatar-overlay">
                      <i className="bi bi-camera-fill"></i>
                    </div>
                    <input
                      id="group-avatar-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="d-none"
                      onChange={handleAvatarChange}
                    />
                  </label>

                  <div className="flex-grow-1">
                    <label
                      className="form-label small fw-medium mb-1"
                      style={{ color: "var(--sbd-muted)" }}
                    >
                      Group Name
                    </label>
                    <input
                      type="text"
                      className="form-control sbd-form-control"
                      placeholder="Enter group name"
                      value={nameDraft}
                      onChange={(e) => {
                        setNameDraft(e.target.value);
                        setProfileSaved(false);
                      }}
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="text-danger small px-1">{profileError}</div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    className="btn btn-sbd-accent w-100"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <span>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </span>
                    ) : profileSaved ? (
                      "Saved ✓"
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: NICKNAMES */}
            {activeTab === "nicknames" && isAdmin && (
              <div>
                <p
                  className="small mb-3"
                  style={{ color: "var(--sbd-muted)", fontSize: "0.825rem" }}
                >
                  Set custom aliases visible only within this group panel.
                </p>

                {nicknameError && (
                  <div className="text-danger small mb-3">{nicknameError}</div>
                )}

                <div className="d-flex flex-column gap-2">
                  {(members || []).map((m) => {
                    const u = m.user;
                    const uid = u?._id;
                    const avatar = resolveMediaUrl(u?.avatarUrl);
                    const realName = getUserDisplayName(u);
                    const isSaving = savingNicknameFor === uid;

                    return (
                      <div
                        key={uid}
                        className="sbd-nickname-row d-flex align-items-center gap-2"
                      >
                        <span
                          className="rounded-circle flex-shrink-0 overflow-hidden"
                          style={{ width: "32px", height: "32px" }}
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={realName}
                              className="w-100 h-100"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <span
                              className="w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-white"
                              style={{
                                backgroundColor: "var(--sbd-accent)",
                                fontSize: "0.75rem",
                              }}
                            >
                              {realName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>

                        <input
                          type="text"
                          className="form-control form-control-sm sbd-form-control flex-grow-1"
                          placeholder={realName}
                          value={nicknameDrafts[uid] ?? ""}
                          onChange={(e) =>
                            setNicknameDrafts((prev) => ({
                              ...prev,
                              [uid]: e.target.value,
                            }))
                          }
                        />

                        <button
                          type="button"
                          className="btn btn-sm sidebar-ghost-btn flex-shrink-0 px-2 py-1"
                          title="Save nickname"
                          onClick={() => handleSaveNickname(uid)}
                          disabled={isSaving}
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--sbd-accent)",
                          }}
                        >
                          {isSaving ? (
                            <span
                              className="spinner-border spinner-border-sm"
                              role="status"
                            ></span>
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: ADMIN PERMISSIONS */}
            {activeTab === "admin" && isAdmin && (
              <div className="d-flex flex-column gap-3">
                <div>
                  <h6
                    className="fw-semibold mb-1"
                    style={{ color: "var(--sbd-text)", fontSize: "0.9rem" }}
                  >
                    Transfer Group Ownership
                  </h6>
                  <p
                    className="small mb-3"
                    style={{ color: "var(--sbd-muted)", fontSize: "0.825rem" }}
                  >
                    Assign another member as group admin. You will step down as
                    primary owner.
                  </p>

                  {otherMembers.length === 0 ? (
                    <div className="small text-muted p-2 rounded background-rail">
                      No other members available in this group.
                    </div>
                  ) : (
                    <>
                      <select
                        className="form-select sbd-form-select mb-3"
                        value={newAdminId}
                        onChange={(e) => setNewAdminId(e.target.value)}
                      >
                        <option value="">Select a member...</option>
                        {otherMembers.map((m) => (
                          <option key={m.user?._id} value={m.user?._id}>
                            {getUserDisplayName(m.user)}
                            {m.role === "admin" ? " (admin)" : ""}
                          </option>
                        ))}
                      </select>

                      {transferError && (
                        <div className="text-danger small mb-2">
                          {transferError}
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn btn-sbd-danger w-100"
                        onClick={handleTransferClick}
                        disabled={transferring || !newAdminId}
                      >
                        {transferring
                          ? "Transferring..."
                          : "Transfer Ownership"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="modal-footer px-4 py-2"
            style={{ borderTop: "1px solid var(--sbd-border)" }}
          >
            <button
              type="button"
              className="btn btn-sm sidebar-ghost-btn px-3"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showTransferConfirm}
        title="Transfer Ownership?"
        message={`Make ${(() => {
          const target = otherMembers.find((m) => String(m.user?._id) === String(newAdminId));
          return target ? getUserDisplayName(target.user) : "this member";
        })()} the admin? You will become a regular member.`}
        confirmLabel="Transfer"
        confirmVariant="danger"
        loading={transferring}
        onConfirm={executeTransfer}
        onCancel={() => setShowTransferConfirm(false)}
      />
    </div>
  );
};

export default EditGroupModal;
