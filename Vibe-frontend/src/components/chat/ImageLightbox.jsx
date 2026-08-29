import { useEffect, useCallback } from "react";

/**
 * Full-screen image lightbox overlay.
 *
 * Props:
 *   src      – image URL to display
 *   alt      – alt text (filename or caption)
 *   onClose  – called when the user dismisses
 */
export default function ImageLightbox({ src, alt = "Image", onClose }) {
  // Close on Escape key
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    // Prevent body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [handleKey]);

  if (!src) return null;

  return (
    <div
      className="image-lightbox-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      {/* Close button */}
      <button
        type="button"
        className="image-lightbox-close"
        onClick={onClose}
        title="Close (Esc)"
        aria-label="Close image preview"
      >
        <i className="bi bi-x-lg" />
      </button>

      {/* Download button */}
      <a
        href={src}
        download={alt}
        className="image-lightbox-download"
        onClick={(e) => e.stopPropagation()}
        title="Download image"
        aria-label="Download image"
      >
        <i className="bi bi-download" />
      </a>

      {/* Image — click stops propagation so clicking image doesn't close */}
      <div
        className="image-lightbox-inner"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="image-lightbox-img"
          draggable={false}
        />
        {alt && alt !== "attachment" && (
          <p className="image-lightbox-caption">{alt}</p>
        )}
      </div>
    </div>
  );
}
