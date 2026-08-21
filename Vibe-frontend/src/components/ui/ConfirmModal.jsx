import "../css/ConfirmModal.css";

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDanger = confirmVariant === "danger";

  return (
    <div
      className="confirm-modal-backdrop"
      onClick={loading ? undefined : onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="confirm-modal-card card shadow border-0 rounded-4 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body p-4 text-center">
          <div
            className={`vibe-confirm-icon-wrap rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center ${
              isDanger
                ? "bg-danger bg-opacity-10 text-danger"
                : "bg-success bg-opacity-10 text-success"
            }`}
            style={{ width: 56, height: 56 }}
          >
            <i
              className={`bi ${
                isDanger
                  ? "bi-exclamation-triangle-fill"
                  : "bi-question-circle-fill"
              } fs-4`}
            />
          </div>

          <h6 id="confirm-dialog-title" className="fw-bold text-dark mb-2 fs-6">
            {title}
          </h6>

          <p className="text-secondary small mb-4 px-2" style={{ lineHeight: "1.45" }}>
            {message}
          </p>

          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-light rounded-pill px-4 btn-sm fw-semibold text-secondary border"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn btn-${confirmVariant} rounded-pill px-4 btn-sm fw-semibold shadow-sm`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-1" role="status" />
              ) : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
