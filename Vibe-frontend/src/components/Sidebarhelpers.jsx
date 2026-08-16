// Shared helpers used by Sidebar and its sub-components.

// Extract a full display name for a user object.
export const getUserDisplayName = (u) => {
  if (!u) return "User";
  if (u.firstName || u.lastName) {
    return `${u.firstName || ""} ${u.lastName || ""}`.trim();
  }
  return u.username || u.name || "User";
};

// Safe helper to extract the "other" participant from a 1:1 conversation.
export const getDMRecipient = (conv, currentUserId) => {
  if (!conv || !Array.isArray(conv.participants)) return null;
  return (
    conv.participants.find((p) => {
      const pId = typeof p === "object" ? p._id || p.id : p;
      return String(pId) !== String(currentUserId);
    }) || null
  );
};

// Display name for any conversation (group or DM), used by search/lists.
export const getConversationDisplayName = (conv, currentUserId) => {
  if (!conv) return "Conversation";
  if (conv.isGroup) return conv.name || "Group";
  const recipient = getDMRecipient(conv, currentUserId);
  return recipient ? getUserDisplayName(recipient) : "Direct Message";
};
