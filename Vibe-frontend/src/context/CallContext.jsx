import { createContext, useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "./SocketContext"; // adjust path if needed

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

// call.status: "idle" | "outgoing" | "incoming" | "connected" | "ended"
export function CallProvider({ children }) {
  const { socket } = useSocket();

  const [call, setCall] = useState({ status: "idle" });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const pcRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const callMetaRef = useRef(null); // { peerId, conversationId, callType, isCaller }
  const localStreamRef = useRef(null);

  // ---------- cleanup ----------
  const cleanup = useCallback(() => {
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
    callMetaRef.current = null;
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  // ---------- endCall ----------
  const endCall = useCallback(
    (notifyPeer = true) => {
      if (notifyPeer && callMetaRef.current) {
        socket.emit("call:end", {
          toUserId: callMetaRef.current.peerId,
          conversationId: callMetaRef.current.conversationId,
        });
      }
      cleanup();
      setCall({ status: "ended" });
      setTimeout(() => setCall({ status: "idle" }), 1500);
    },
    [socket, cleanup],
  );

  // ---------- createPeerConnection ----------
  const createPeerConnection = useCallback(
    (peerId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // temporary debug helper
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
        // Prefer the stream from the event; fallback to creating one
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
        };
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
      callMetaRef.current = {
        peerId,
        conversationId,
        callType,
        isCaller: false,
      };

      const stream = await getMedia(callType);
      const pc = createPeerConnection(peerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush any ICE candidates that arrived early
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
      t.enabled = isMuted; // will be flipped below
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

  // ---------- Socket listeners (stable – do NOT depend on call.status) ----------
  useEffect(() => {
    if (!socket) return;

    const onIncoming = ({ fromUserId, conversationId, callType }) => {
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
      if (!pc) {
        console.warn("onAnswer: no peer connection");
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush candidates that arrived before the answer
        for (const c of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (err) {
            console.warn("Failed to add ICE candidate after answer", err);
          }
        }
        pendingCandidatesRef.current = [];

        // Ensure caller also moves to connected
        setCall((prev) => ({ ...prev, status: "connected" }));
      } catch (err) {
        console.error("Failed to set remote answer", err);
      }
    };

    const onAccepted = () => {
      setCall((prev) => ({ ...prev, status: "connected" }));
    };

    const onRejected = ({ reason }) => {
      cleanup();
      setCall({ status: "idle" });
      console.log(
        `Call ended: ${reason === "busy" ? "user is busy" : "call declined"}`,
      );
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
      cleanup();
      setCall({ status: "ended" });
      setTimeout(() => setCall({ status: "idle" }), 1500);
    };

    const onUnavailable = () => {
      cleanup();
      setCall({ status: "idle" });
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
  }, [socket, cleanup]); // only socket + cleanup

  return (
    <CallContext.Provider
      value={{
        call,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
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
