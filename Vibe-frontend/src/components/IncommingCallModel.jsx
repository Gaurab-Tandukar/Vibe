import { useCall } from "../hooks/useCall";

// Mount once near the root of your app, self-hides unless call.status === "incoming"
export default function IncomingCallModal({ getUserById }) {
  // getUserById: optional helper (userId) => { name, avatarUrl } for showing caller info,
  // pull from your existing conversation/member state instead if you prefer.
  const { call, acceptCall, rejectCall } = useCall();

  if (call.status !== "incoming") return null;

  const caller = getUserById ? getUserById(call.peerId) : null;

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card">
        {caller?.avatarUrl && (
          <img src={caller.avatarUrl} alt="" className="incoming-call-avatar" />
        )}
        <div className="incoming-call-name">{caller?.name || "Someone"}</div>
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
