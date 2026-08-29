import { createContext, useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "./SocketContext";
import { sendMessage } from "../api/messageService";

// eslint-disable-next-line react-refresh/only-export-components
export const CallContext = createContext(null);

// --- ICE server config ---
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
  ],
};

const formatSeconds = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const h = Math.floor(m / 60);
  if (h > 0) {
    const remM = m % 60;
    return `${String(h).padStart(2, "0")}:${String(remM).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const dispatchToast = (message, type = "info") => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("vibe:toast", {
        detail: { message, type },
      }),
    );
  }
};

// call.status: "idle" | "outgoing" | "incoming" | "connected" | "ended"
export function CallProvider({ children }) {
  const { socket } = useSocket();

  const [call, setCall] = useState({ status: "idle" });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const pcRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const callMetaRef = useRef(null); // { peerId, conversationId, callType, isCaller, connectedAt }
  const localStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // ---------- cleanup ----------
  const cleanup = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    pendingCandidatesRef.current = [];
    setCallSeconds(0);
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  // Record call message into conversation
  const recordCallMessage = useCallback(
    async (finalDurationSec = 0, isMissed = false, reason = "") => {
      const meta = callMetaRef.current;
      if (!meta || !meta.conversationId) return;

      // Only the caller logs missed/declined calls, or the terminating party logs ended calls
      if (isMissed && !meta.isCaller) return;

      try {
        let content = "";
        const icon = meta.callType === "video" ? "📹 Video call" : "📞 Audio call";

        if (isMissed) {
          if (reason === "declined") {
            content = `${icon} declined`;
          } else if (reason === "busy") {
            content = `${icon} missed (busy)`;
          } else {
            content = `Missed ${meta.callType === "video" ? "video" : "audio"} call`;
          }
        } else {
          const durationStr = formatSeconds(finalDurationSec);
          content = `${icon} ended • ${durationStr}`;
        }

        await sendMessage({
          conversationId: meta.conversationId,
          content,
          type: "system",
        });
      } catch (err) {
        console.error("Failed to record call log message:", err);
      }
    },
    [],
  );

  // ---------- endCall ----------
  const endCall = useCallback(
    (notifyPeer = true) => {
      const meta = callMetaRef.current;
      if (meta) {
        if (notifyPeer) {
          socket.emit("call:end", {
            toUserId: meta.peerId,
            conversationId: meta.conversationId,
          });
        }

        if (meta.connectedAt) {
          const dur = Math.max(
            1,
            Math.round((Date.now() - meta.connectedAt) / 1000),
          );
          if (meta.isCaller) {
            recordCallMessage(dur, false);
          }
        } else if (meta.isCaller) {
          recordCallMessage(0, true, "cancelled");
        }
      }

      cleanup();
      callMetaRef.current = null;
      setCall({ status: "ended" });
      setTimeout(() => setCall({ status: "idle" }), 1500);
    },
    [socket, cleanup, recordCallMessage],
  );

  // ---------- createPeerConnection ----------
  const createPeerConnection = useCallback(
    (peerId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      window.pc = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate && callMetaRef.current) {
          socket.emit("call:ice-candidate", {
            toUserId: peerId,
            candidate: e.candidate,
          });
        }
      };

      pc.ontrack = (e) => {
        const stream = e.streams[0] || new MediaStream([e.track]);
        setRemoteStream(stream);
      };

      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          if (callMetaRef.current) endCall(false);
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [socket, endCall],
  );

  // ---------- getMedia ----------
  const getMedia = async (callType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  // ---------- Caller ----------
  const startCall = useCallback(
    async (peerId, conversationId, callType) => {
      try {
        callMetaRef.current = {
          peerId,
          conversationId,
          callType,
          isCaller: true,
          connectedAt: null,
        };
        setCallSeconds(0);
        setCall({ status: "outgoing", peerId, conversationId, callType });

        const stream = await getMedia(callType);
        const pc = createPeerConnection(peerId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:invite", {
          toUserId: peerId,
          conversationId,
          callType,
        });
        socket.emit("call:offer", { toUserId: peerId, offer });
      } catch (err) {
        console.error("startCall failed:", err);
        cleanup();
        setCall({ status: "idle" });
        dispatchToast("Could not access microphone/camera for call", "error");
      }
    },
    [socket, createPeerConnection, cleanup],
  );

  // ---------- Callee ----------
  const acceptCall = useCallback(async () => {
    const { peerId, conversationId, callType, offer } = call;

    if (!offer) {
      console.error("acceptCall: no offer present");
      return;
    }

    try {
      const now = Date.now();
      callMetaRef.current = {
        peerId,
        conversationId,
        callType,
        isCaller: false,
        connectedAt: now,
      };

      const stream = await getMedia(callType);
      const pc = createPeerConnection(peerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      for (const c of pendingCandidatesRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (err) {
          console.warn("Failed to add early ICE candidate", err);
        }
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", { toUserId: peerId, answer });
      socket.emit("call:accept", { toUserId: peerId, conversationId });

      setCallSeconds(0);
      setCall({ status: "connected", peerId, conversationId, callType });
    } catch (err) {
      console.error("acceptCall failed:", err);
      cleanup();
      setCall({ status: "idle" });
    }
  }, [call, socket, createPeerConnection, cleanup]);

  // ---------- reject ----------
  const rejectCall = useCallback(() => {
    if (call.peerId) {
      socket.emit("call:reject", {
        toUserId: call.peerId,
        conversationId: call.conversationId,
        reason: "declined",
      });
    }
    cleanup();
    setCall({ status: "idle" });
  }, [call, socket, cleanup]);

  // ---------- media controls ----------
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = isMuted;
    });
    setIsMuted((m) => !m);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = isCameraOff;
    });
    setIsCameraOff((c) => !c);
  };

  // Timer interval for connected calls
  useEffect(() => {
    if (call.status === "connected") {
      const startTime = Date.now();
      if (callMetaRef.current && !callMetaRef.current.connectedAt) {
        callMetaRef.current.connectedAt = startTime;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCallSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setCallSeconds(elapsed);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [call.status]);

  // ---------- Socket listeners ----------
  useEffect(() => {
    if (!socket) return;

    const onIncoming = ({ fromUserId, caller, conversationId, callType }) => {
      setCall((prev) => {
        if (prev.status !== "idle") {
          socket.emit("call:reject", {
            toUserId: fromUserId,
            conversationId,
            reason: "busy",
          });
          return prev;
        }
        return {
          status: "incoming",
          peerId: fromUserId,
          caller,
          conversationId,
          callType,
        };
      });
    };

    const onOffer = ({ offer }) => {
      setCall((prev) => ({ ...prev, offer }));
    };

    const onAnswer = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        for (const c of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (err) {
            console.warn("Failed to add ICE candidate after answer", err);
          }
        }
        pendingCandidatesRef.current = [];

        if (callMetaRef.current) {
          callMetaRef.current.connectedAt = Date.now();
        }
        setCall((prev) => ({ ...prev, status: "connected" }));
      } catch (err) {
        console.error("Failed to set remote answer", err);
      }
    };

    const onAccepted = () => {
      if (callMetaRef.current) {
        callMetaRef.current.connectedAt = Date.now();
      }
      setCall((prev) => ({ ...prev, status: "connected" }));
    };

    const onRejected = ({ reason }) => {
      if (callMetaRef.current?.isCaller) {
        recordCallMessage(0, true, reason);
      }
      cleanup();
      setCall({ status: "idle" });

      if (reason === "busy") {
        dispatchToast("User is busy in another call", "info");
      } else {
        dispatchToast("Call was declined", "info");
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("addIceCandidate error", err);
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const onCallEnd = () => {
      const meta = callMetaRef.current;
      if (meta?.connectedAt && meta.isCaller) {
        const dur = Math.max(
          1,
          Math.round((Date.now() - meta.connectedAt) / 1000),
        );
        recordCallMessage(dur, false);
      }
      cleanup();
      callMetaRef.current = null;
      setCall({ status: "ended" });
      setTimeout(() => setCall({ status: "idle" }), 1500);
    };

    const onUnavailable = () => {
      if (callMetaRef.current?.isCaller) {
        recordCallMessage(0, true, "offline");
      }
      cleanup();
      callMetaRef.current = null;
      setCall({ status: "idle" });
      dispatchToast("User is currently offline and unavailable for calls", "error");
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:end", onCallEnd);
    socket.on("call:unavailable", onUnavailable);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:end", onCallEnd);
      socket.off("call:unavailable", onUnavailable);
    };
  }, [socket, cleanup, recordCallMessage]);

  const formattedDuration = formatSeconds(callSeconds);

  return (
    <CallContext.Provider
      value={{
        call,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        callSeconds,
        formattedDuration,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}
