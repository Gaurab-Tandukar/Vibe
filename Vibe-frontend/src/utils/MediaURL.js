// Your API base is something like "http://localhost:3000/api".
// Uploaded file paths from the backend are relative, e.g. "/uploads/avatars/x.jpg",
// which only resolves correctly against the backend's origin — not "/api",
// and not the frontend's own origin. This strips "/api" off the base
// so relative upload paths resolve to the right place.
const API_URL = import.meta.env.VITE_API_URL || "";
const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, "");

/**
 * Turns a relative upload path (or an already-absolute URL, or a
 * blob:/data: preview URL) into something an <img> can actually load.
 */
export function resolveMediaUrl(path) {
  if (!path) return path;
  if (/^(https?:|blob:|data:)/i.test(path)) return path; // already usable as-is
  return `${SERVER_ORIGIN}${path}`;
}
