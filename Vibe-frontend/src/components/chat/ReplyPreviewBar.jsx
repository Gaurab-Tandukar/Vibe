export default function ReplyPreviewBar({ replyingTo, onCancel }) {
  if (!replyingTo) return null;

  return (
    <div className="px-3 py-2 border-top bg-light d-flex align-items-center justify-content-between">
      <div className="overflow-hidden">
        <div className="small fw-semibold text-success">
          Replying to {replyingTo.sender?.username || "message"}
        </div>
        <div className="small text-truncate text-muted">
          {replyingTo.content}
        </div>
      </div>
      <button
        type="button"
        className="btn btn-sm btn-light rounded-circle"
        style={{ width: 26, height: 26 }}
        onClick={onCancel}
        aria-label="Cancel reply"
      >
        <i className="bi bi-x" />
      </button>
    </div>
  );
}
