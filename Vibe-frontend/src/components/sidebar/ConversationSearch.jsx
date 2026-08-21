import { useMemo } from "react";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { getConversationDisplayName, getDMRecipient } from "./Sidebarhelpers";

/**
 * Searches only the conversations already loaded into the sidebar
 * (conversations the current user has NOT hidden — the backend never
 * returns hidden conversations from getMyConversations). This does not
 * create anything new; it just jumps you to an existing chat.
 *
 * `query`/`onQueryChange` are controlled by the parent (Sidebar) so it can
 * hide the full conversation list underneath while a search is active.
 */
const ConversationSearch = ({
  conversations,
  currentUserId,
  query,
  onQueryChange,
  onSelect,
}) => {
  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return conversations.filter((conv) => {
      const name = getConversationDisplayName(
        conv,
        currentUserId,
      ).toLowerCase();
      if (name.includes(trimmed)) return true;

      if (!conv.isGroup) {
        const recipient = getDMRecipient(conv, currentUserId);
        const username = (recipient?.username || "").toLowerCase();
        if (username.includes(trimmed)) return true;
      }
      return false;
    });
  }, [conversations, currentUserId, query]);

  const handleSelect = (conv) => {
    onSelect(conv);
    onQueryChange("");
  };

  return (
    <div className="px-3 mb-2">
      <div className="input-group input-group-sm sidebar-search">
        <span className="input-group-text border-end-0">
          <i className="bi bi-search"></i>
        </span>
        <input
          type="text"
          className="form-control border-start-0 ps-0"
          placeholder="Search your conversations"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      {query.trim() !== "" && (
        <div className="sidebar-search-results mt-1">
          {results.length === 0 ? (
            <div className="px-2 small text-muted py-2">
              No matching conversations
            </div>
          ) : (
            results.map((conv) => {
              const name = getConversationDisplayName(conv, currentUserId);
              const recipient = !conv.isGroup
                ? getDMRecipient(conv, currentUserId)
                : null;
              const avatar = conv.isGroup
                ? null
                : resolveMediaUrl(recipient?.avatarUrl);

              return (
                <button
                  key={conv._id}
                  className="sidebar-chat-item btn text-start d-flex align-items-center gap-2 rounded-4 px-2 py-2 w-100 mb-1"
                  onClick={() => handleSelect(conv)}
                >
                  <span
                    className="position-relative flex-shrink-0 rounded-circle overflow-hidden"
                    style={{ width: "32px", height: "32px" }}
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <span
                        className="w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-white"
                        style={{ backgroundColor: "var(--sbd-accent)" }}
                      >
                        {conv.isGroup ? (
                          <i
                            className="bi bi-people-fill"
                            style={{ fontSize: "0.9rem" }}
                          ></i>
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </span>
                    )}
                  </span>
                  <div className="d-flex flex-column overflow-hidden">
                    <span
                      className="text-truncate small"
                      style={{ color: "var(--sbd-text)" }}
                    >
                      {name}
                    </span>
                    <span className="text-truncate extra-small text-muted">
                      {conv.isGroup
                        ? "Group"
                        : recipient?.username
                          ? `@${recipient.username}`
                          : ""}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationSearch;
