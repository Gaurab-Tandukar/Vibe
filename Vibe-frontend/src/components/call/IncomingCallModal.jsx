import { useCall } from "../../hooks/useCall";
import { resolveMediaUrl } from "../../utils/MediaURL";

// Mount once near the root of your app, self-hides unless call.status === "incoming"
export default function IncomingCallModal({ getUserById }) {
  const { call, acceptCall, rejectCall } = useCall();

  if (call.status !== "incoming") return null;

  const caller = call.caller || (getUserById ? getUserById(call.peerId) : null);
  const username = caller?.username ? `@${caller.username}` : "";
  const fullName =
    caller?.firstName && caller?.lastName
      ? `${caller.firstName} ${caller.lastName}`
      : caller?.name || "";
  const displayName = username || fullName || "Someone";
  const avatarUrl = caller?.avatarUrl ? resolveMediaUrl(caller.avatarUrl) : null;
  const initial = (caller?.username || caller?.firstName || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="incoming-call-avatar" />
        ) : (
          <div
            className="incoming-call-avatar d-flex align-items-center justify-content-center fw-bold fs-3 text-white"
            style={{ backgroundColor: "var(--sbd-accent, #52c98a)" }}
          >
            {initial}
          </div>
        )}
        <div className="incoming-call-name text-center">
          <div>{displayName}</div>
          {fullName && username && (
            <div className="small text-muted fw-normal mt-1">{fullName}</div>
          )}
        </div>
        <div className="incoming-call-type">
          Incoming {call.callType === "video" ? "video" : "audio"} call…
        </div>
        <div className="incoming-call-actions">
          <button onClick={rejectCall} className="call-btn call-btn-end">
            Decline
          </button>
          <button onClick={acceptCall} className="call-btn call-btn-accept">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
