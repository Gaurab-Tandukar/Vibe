import { useEffect, useRef, useCallback } from "react";
import { useCall } from "../hooks/useCall";

export default function VideoCall() {
  const {
    call,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    formattedDuration,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ---------- Callback refs (the reliable way) ----------
  const setLocalVideoRef = useCallback(
    (node) => {
      localVideoRef.current = node;
      if (node && localStream) {
        if (node.srcObject !== localStream) {
          node.srcObject = localStream;
          node.muted = true;
          node.play().catch(() => {});
        }
      }
    },
    [localStream],
  );

  const setRemoteVideoRef = useCallback(
    (node) => {
      remoteVideoRef.current = node;
      if (node && remoteStream) {
        if (node.srcObject !== remoteStream) {
          node.srcObject = remoteStream;
          node.muted = false;
          node.play().catch((e) => console.warn("remote play failed", e));
        }
      }
    },
    [remoteStream],
  );

  // ---------- Safety-net effects ----------
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStream && video.srcObject !== localStream) {
      video.srcObject = localStream;
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    const video = remoteVideoRef.current;
    if (video && remoteStream && video.srcObject !== remoteStream) {
      video.srcObject = remoteStream;
      video.muted = true;
      video.play().catch((e) => console.warn("remote play failed", e));
    }
  }, [remoteStream]);

  // Only hide when completely idle
  if (call.status === "idle" || !call.status) return null;

  const isVideoCall = call.callType === "video";
  const isConnected = call.status === "connected";

  return (
    <div className="call-overlay">
      <div className="call-status-label">
        {call.status === "outgoing" ? (
          <span className="d-flex align-items-center gap-2">
            <span className="spinner-grow spinner-grow-sm text-light" role="status" />
            Calling…
          </span>
        ) : call.status === "incoming" ? (
          "Incoming call…"
        ) : isConnected ? (
          <div className="call-timer-chip">
            <span className="call-timer-dot" />
            <span className="call-timer-text">{formattedDuration}</span>
          </div>
        ) : (
          "Call ended"
        )}
      </div>

      {isVideoCall ? (
        <div className="call-video-stage">
          {/* Remote = big video */}
          <video
            ref={setRemoteVideoRef}
            autoPlay
            playsInline
            className="call-remote-video"
          />

          {/* Local = PiP */}
          <video
            ref={setLocalVideoRef}
            autoPlay
            playsInline
            muted
            className="call-local-video"
          />
        </div>
      ) : (
        <div className="call-audio-stage">
          {/* Audio-only still needs a media element to play remote sound */}
          <audio ref={setRemoteVideoRef} autoPlay />
          <div className="call-audio-avatar">
            <i className="bi bi-mic-fill" style={{ fontSize: "2.5rem" }} />
          </div>
          {isConnected && (
            <div className="call-audio-label">
              <span>Connected</span>
            </div>
          )}
        </div>
      )}

      <div className="call-controls">
        <button
          type="button"
          onClick={toggleMute}
          className={`call-btn ${isMuted ? "active" : ""}`}
          title={isMuted ? "Unmute mic" : "Mute mic"}
        >
          <i className={`bi ${isMuted ? "bi-mic-mute-fill" : "bi-mic-fill"} me-1`} />
          {isMuted ? "Unmute" : "Mute"}
        </button>

        {isVideoCall && (
          <button
            type="button"
            onClick={toggleCamera}
            className={`call-btn ${isCameraOff ? "active" : ""}`}
            title={isCameraOff ? "Turn camera on" : "Turn camera off"}
          >
            <i className={`bi ${isCameraOff ? "bi-camera-video-off-fill" : "bi-camera-video-fill"} me-1`} />
            {isCameraOff ? "Camera On" : "Camera Off"}
          </button>
        )}

        <button
          type="button"
          onClick={() => endCall(true)}
          className="call-btn call-btn-end"
          title="End Call"
        >
          <i className="bi bi-telephone-x-fill me-1" />
          End Call
        </button>
      </div>
    </div>
  );
}
