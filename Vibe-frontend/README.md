# Vibe – Frontend

React 19 + Vite frontend for the Vibe real-time chat & WebRTC calling application.

🔗 **Live:** [https://vibe-app.duckdns.org](https://vibe-app.duckdns.org)

---

## 📁 Folder Structure

```
Vibe-frontend/
├── .env                        # Environment variables (gitignored)
├── .env.example                # Template — copy to .env and fill in
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── public/
│   └── favicon.png
│
├── dist/                       # Production build output
│
└── src/
    ├── main.jsx                # App entry point
    ├── App.jsx
    ├── App.css
    ├── index.css
    │
    ├── api/                    # Axios services
    │   ├── axiosInstance.js
    │   ├── authService.js
    │   ├── conversationService.js
    │   ├── messageService.js
    │   ├── profileService.js
    │   ├── reactionService.js
    │   └── attachmentService.js
    │
    ├── assets/                 # Static images & icons
    │
    ├── components/
    │   ├── call/
    │   │   ├── VideoCall.jsx           # Full-screen call UI
    │   │   └── IncomingCallModal.jsx   # Incoming call modal
    │   ├── chat/
    │   │   ├── ChatWindow.jsx          # Message list, input, reactions
    │   │   ├── MessageInput.jsx
    │   │   ├── MessageItem.jsx
    │   │   ├── MessageList.jsx
    │   │   ├── ChatHeader.jsx
    │   │   ├── AddMemberModal.jsx      # Add members to a group
    │   │   ├── EditGroupModal.jsx      # Edit group name/avatar
    │   │   ├── Avatar.jsx
    │   │   └── ReplyPreviewBar.jsx
    │   ├── sidebar/
    │   │   ├── Sidebar.jsx             # Conversation list & search
    │   │   ├── ConversationItem.jsx
    │   │   ├── ConversationSearch.jsx  # Search conversations
    │   │   ├── NewGroupModal.jsx       # Create group conversation
    │   │   ├── NewDirectMessageModal.jsx # Start private chat
    │   │   ├── GroupMembersPanel.jsx   # View/manage group members
    │   │   └── BlockedUsersModal.jsx
    │   ├── layout/
    │   │   ├── Navbar.jsx
    │   │   └── Footer.jsx
    │   ├── notification/
    │   │   └── NotificationDropdown.jsx
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── FormField.jsx
    │   │   ├── CloseBtn.jsx
    │   │   ├── ConfirmModal.jsx
    │   │   ├── Loader.jsx              # Loading spinner
    │   │   └── ProtectedRoute.jsx      # Auth guard for private routes
    │   ├── workspace/
    │   │   └── IdeWorkspace.jsx
    │   └── css/                    # Component-specific styles
    │
    ├── context/
    │   ├── AuthContext.jsx         # JWT + user state
    │   ├── SocketContext.jsx       # Socket.io connection
    │   ├── CallContext.jsx         # WebRTC call state & signaling
    │   └── ToastContext.jsx
    │
    ├── hooks/
    │   ├── useAuth.jsx
    │   └── useCall.jsx
    │
    ├── pages/
    │   ├── home/               # Landing / marketing page
    │   ├── login/
    │   ├── register/
    │   ├── chat/               # Main chat interface
    │   ├── profile/            # View & edit profile
    │   ├── about/
    │   ├── contact/
    │   ├── legal/              # Privacy & Terms pages
    │   ├── error/              # 404 page
    │   └── main/
    │
    ├── routes/
    │   ├── AppRoutes.jsx
    │   └── GuestRoute.jsx
    │
    └── utils/
        └── MediaURL.js             # Helper for uploaded file URLs
```

---

## 🧰 Tech Stack

| Technology                 | Version | Purpose                            |
| -------------------------- | ------- | ---------------------------------- |
| React                      | ^19.2   | UI library                         |
| Vite                       | ^8.2    | Build tool & dev server            |
| React Router DOM           | ^7.18   | Client-side routing                |
| Context API + custom hooks | —       | Global state (auth, socket, calls) |
| socket.io-client           | ^4.8    | Real-time events                   |
| Axios                      | ^1.19   | HTTP requests                      |
| Bootstrap 5                | ^5.3    | UI component base & layout         |
| Bootstrap Icons            | ^1.13   | Icon set                           |
| Font Awesome               | ^7.3    | Additional icons                   |
| Native WebRTC              | —       | Audio / video calls                |
| Custom CSS                 | —       | Component-level styling            |

**No extra WebRTC libraries** are used (`simple-peer`, `peerjs`, etc. are not required).

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the root of `Vibe-frontend/` and fill in your own values:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000

# Metered.ca TURN credentials (required for reliable calls behind NAT)
VITE_TURN_USERNAME=your_metered_username
VITE_TURN_CREDENTIAL=your_metered_credential
```

> Only variables prefixed with `VITE_` are exposed to the browser. Vite bakes these in at **build time** — changing `.env` requires a rebuild (`npm run build`) to take effect, both locally and in deployment.

---

## 🚀 Getting Started

```bash
cd Vibe-frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

Build for production:

```bash
npm run build
npm run preview   # optional local preview of the build
```

---

## ☁️ Deployment

In production, the `dist/` build output is served directly by Nginx as static files (no Node process needed for the frontend) — see the [root README's Deployment section](../readme.md#️-deployment) for the full architecture. Deploys are automated via GitHub Actions on every push to `main`.

**Important:** `VITE_API_URL` must point to the deployed backend's HTTPS URL in production. WebRTC calling (`getUserMedia`) requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) — it will not work over plain `http://` on a non-localhost address.

---

## 🔑 Authentication Flow

1. User registers or logs in → receives JWT.
2. Token is stored in `AuthContext` (memory / localStorage).
3. Axios instance automatically attaches `x-auth-token` header.
4. Socket.io connection is opened with the same token in `auth`.
5. `GuestRoute` redirects authenticated users away from `/`, `/login`, and `/register`.
6. `ProtectedRoute` redirects unauthenticated users to `/login`.

---

## 🗯️ Client-Side Routes

| Path                 | Access     | Component         |
| -------------------- | ---------- | ----------------- |
| `/`                  | Guest only | `HomePage`        |
| `/login`             | Guest only | `LoginPage`       |
| `/register`          | Guest only | `RegisterPage`    |
| `/about`             | Public     | `AboutPage`       |
| `/contact`           | Public     | `ContactPage`     |
| `/privacy`           | Public     | `PrivacyPage`     |
| `/terms`             | Public     | `TermsPage`       |
| `/chat`              | Auth only  | `ChatHome`        |
| `/profile`           | Auth only  | `ProfilePage`     |
| `/profile/:username` | Auth only  | `ProfilePage`     |
| `/profile/edit`      | Auth only  | `EditProfilePage` |
| `*`                  | Public     | `ErrorPage`       |

---

## 📞 WebRTC Calling Architecture

### Key files

- `src/context/CallContext.jsx` – call state, peer connection, signaling
- `src/components/call/VideoCall.jsx` – full-screen UI + media element attachment
- `src/components/call/IncomingCallModal.jsx` – accept / reject UI
- `src/hooks/useCall.jsx` – convenience hook

### Flow summary

1. **Caller** gets user media → creates `RTCPeerConnection` → adds tracks → creates offer → sends `call:invite` + `call:offer` via Socket.io.
2. **Callee** receives incoming call → on accept: gets media → creates peer connection → sets remote description → creates answer → sends `call:answer`.
3. ICE candidates are exchanged in both directions via `call:ice-candidate`.
4. When connection is established, `ontrack` fires → remote stream is set → `VideoCall` attaches streams to `<video>` elements via callback refs.
5. Mute / camera toggle simply enable/disable the local tracks.
6. End call closes the peer connection and notifies the other side.

### ICE / TURN

The peer connection is configured with:

- Google public STUN
- Metered STUN
- Metered TURN (UDP, TCP, TLS) using credentials from `.env`

TURN is only used when a direct peer-to-peer connection cannot be established.

---

## 🎨 Main UI Components

| Component               | Role                                             |
| ----------------------- | ------------------------------------------------ |
| `Sidebar`               | Conversation list, search, new chat/group        |
| `ChatWindow`            | Message list, input, reactions, attachments      |
| `VideoCall`             | Full-screen call overlay (remote + local video)  |
| `IncomingCallModal`     | Incoming call accept/reject dialog               |
| `NewGroupModal`         | Create a new group conversation                  |
| `NewDirectMessageModal` | Start a new private chat                         |
| `EditGroupModal`        | Edit group name, avatar, description             |
| `GroupMembersPanel`     | View members list, promote/remove                |
| `AddMemberModal`        | Add new members to an existing group             |
| `ConversationSearch`    | Search across conversations                      |
| `Navbar`                | Top navigation bar                               |
| `Loader`                | Loading spinner for async states                 |
| Various modals/forms    | Reusable `Button`, `FormField`, `CloseBtn`, etc. |

---

## 📦 Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint
```

---

## 📝 Notes

- The call UI (`VideoCall` + `IncomingCallModal`) is mounted globally in `main.jsx` so it persists across page navigation.
- The call UI only renders visibly when `call.status` is not `"idle"`.
- Video elements use **callback refs** so streams are attached reliably even with React 19 StrictMode and timing races.
- Remote video is muted by default to satisfy browser autoplay policies.
- All real-time features (messages, typing, presence, calls) share the same Socket.io connection managed by `SocketContext`.
- Bootstrap 5 is used for layout utilities; component-specific styles live in `src/components/css/`.
- Only variables prefixed with `VITE_` are exposed to the browser bundle.
- **Case sensitivity:** this project deploys to a Linux CI/production environment while development often happens on Windows, which is case-insensitive by default. Import paths (`import ... from "./utils/MediaURL"`) must match actual filenames exactly, including capitalization, or the production build will fail even though it works locally.
