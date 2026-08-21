import { useState } from "react";
import { resolveMediaUrl } from "../../utils/mediaUrl";

/**
 * Circular avatar with image loading and initials fallback
 */
export default function Avatar({
  sender,
  show = true,
  size = 32,
  fallbackBg = "bg-secondary",
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!show) {
    return <span className="flex-shrink-0" style={{ width: size, height: size }} />;
  }

  const rawUrl = sender?.avatarUrl;
  const avatarUrl = rawUrl ? resolveMediaUrl(rawUrl) : null;
  const showImage = Boolean(avatarUrl) && !imgFailed;
  const initial = (sender?.username || sender?.name || "?").charAt(0).toUpperCase();

  return (
    <span
      className={`rounded-circle flex-shrink-0 overflow-hidden d-flex align-items-center justify-content-center text-white fw-bold shadow-sm ${fallbackBg}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      title={sender?.username || sender?.name}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={sender?.username || sender?.name || "User"}
          className="w-100 h-100"
          style={{ objectFit: "cover" }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        initial
      )}
    </span>
  );
}
