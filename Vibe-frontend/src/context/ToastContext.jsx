import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ToastContext = createContext(null);

let _globalIdCounter = 0;

/**
 * Provides a global toast notification system.
 *
 * Toast spec:
 *  - Top-right corner, fixed
 *  - Light bg + colored left border per type
 *  - Headline + optional description
 *  - × dismiss button + auto-dismiss after 4 s
 *  - Types: success (green), error (red), warning (amber), info (blue)
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    // Wait for exit animation then actually remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback(
    (headline, { description = "", type = "success", duration = 4000 } = {}) => {
      const id = ++_globalIdCounter;
      setToasts((prev) => [...prev, { id, headline, description, type, exiting: false }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast],
  );

  // Bridge: listen for legacy "vibe:toast" CustomEvents from anywhere
  // (e.g. CallContext dispatches these outside React tree).
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.message) {
        showToast(e.detail.message, { type: e.detail.type || "info" });
      }
    };
    window.addEventListener("vibe:toast", handler);
    return () => window.removeEventListener("vibe:toast", handler);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* ── Toast container ─────────────────────────────── */}
      {toasts.length > 0 && (
        <div className="vibe-toast-container" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`vibe-toast vibe-toast--${t.type} ${t.exiting ? "vibe-toast--exit" : ""}`}
              role="alert"
            >
              {/* Colored accent bar */}
              <div className="vibe-toast__bar" />

              {/* Icon */}
              <i className={`bi ${iconFor(t.type)} vibe-toast__icon`} />

              {/* Text */}
              <div className="vibe-toast__body">
                <span className="vibe-toast__headline">{t.headline}</span>
                {t.description && (
                  <span className="vibe-toast__desc">{t.description}</span>
                )}
              </div>

              {/* Dismiss */}
              <button
                type="button"
                className="vibe-toast__close"
                aria-label="Dismiss"
                onClick={() => removeToast(t.id)}
              >
                <i className="bi bi-x" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/** Convenience hook — returns `{ showToast }` */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// ── helpers ──

function iconFor(type) {
  switch (type) {
    case "success":
      return "bi-check-circle-fill";
    case "error":
      return "bi-exclamation-triangle-fill";
    case "warning":
      return "bi-exclamation-circle-fill";
    case "info":
    default:
      return "bi-info-circle-fill";
  }
}
