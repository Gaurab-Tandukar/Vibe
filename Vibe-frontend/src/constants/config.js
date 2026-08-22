export const STORAGE_KEYS = {
  TOKEN: "vibe_token",
  USER: "vibe_user",
  THEME: "vibe_theme",
};

export const API_CONFIG = {
  BASE_URL: `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`,
  TIMEOUT: 15000,
};

export const CHAT_CONFIG = {
  MESSAGE_PAGE_LIMIT: 25,
  TYPING_DEBOUNCE_MS: 1500,
  TYPING_EXPIRY_MS: 4000,
  MAX_ATTACHMENT_SIZE_MB: 10,
};
