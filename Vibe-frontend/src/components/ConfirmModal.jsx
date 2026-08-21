import "./css/ConfirmModal.css";

/**
 * Reusable confirmation dialog.
 *
 * Props
 * ─────
 * open           : boolean   — show / hide
 * title          : string    — heading, e.g. "Delete Message?"
 * message        : string    — body text
 * confirmLabel   : string    — button text, default "Confirm"
 * cancelLabel    : string    — button text, default "Cancel"
 * confirmVariant : string    — "danger" | "warning" | "primary", default "danger"
 * onConfirm      : () => void
 * onCancel       : () => void
 * loading        : boolean   — disables buttons while action runs
 */
export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  const iconClass =
    confirmVariant === "danger"
      ? "bi-exclamation-triangle-fill text-danger"
      : confirmVariant === "warning"
        ? "bi-exclamation-circle-fill text-warning"
        : "bi-question-circle-fill text-primary";

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div
        className="confirm-modal-card card shadow border-0 rounded-4 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body p-1 text-center">
          <i className={`bi ${iconClass} fs-1 mb-2 d-block`} />
          <h6 className="fw-bold mb-1">{title}</h6>
          {message && <p className="text-muted small mb-3">{message}</p>}
          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-light rounded-pill px-3 btn-sm text-secondary fw-semibold"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn btn-${confirmVariant} rounded-pill px-3 btn-sm fw-semibold`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading && (
                <span className="spinner-border spinner-border-sm me-1" role="status" />
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
