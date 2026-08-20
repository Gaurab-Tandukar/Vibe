import { useEffect, useRef, useCallback } from "react";
import { useCall } from "../hooks/useCall"; // adjust path if needed

export default function VideoCall() {
  const {
    call,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
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

  return (
    <div className="call-overlay">
      <div className="call-status-label">
        {call.status === "outgoing" ? "Calling…" : isVideoCall ? "" : "On call"}
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
          <div className="call-audio-avatar">🎙️</div>
        </div>
      )}

      <div className="call-controls">
        <button
          onClick={toggleMute}
          className={`call-btn ${isMuted ? "active" : ""}`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>

        {isVideoCall && (
          <button
            onClick={toggleCamera}
            className={`call-btn ${isCameraOff ? "active" : ""}`}
          >
            {isCameraOff ? "Camera On" : "Camera Off"}
          </button>
        )}

        <button onClick={() => endCall(true)} className="call-btn call-btn-end">
          End Call
        </button>
      </div>
    </div>
  );
}
