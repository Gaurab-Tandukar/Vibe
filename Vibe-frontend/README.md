# Vibe Frontend

React + Vite frontend for the Vibe real-time chat & WebRTC calling application.

---

## 📁 Folder Structure

```
Vibe-frontend/
├── .env                        # Environment variables (gitignored)
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
    │   ├── authSevice.js
    │   ├── conversationService.js
    │   ├── messageService.js
    │   ├── profileService.js
    │   ├── reactionService.js
    │   └── attachmentService.js
    │
    ├── assets/                 # Static images & icons
    │
    ├── components/
    │   ├── VideoCall.jsx           # Full-screen call UI
    │   ├── IncommingCallModel.jsx  # Incoming call modal
    │   ├── ChatWindow.jsx
    │   ├── Sidebar.jsx
    │   ├── Navbar.jsx
    │   ├── ... (modals, forms, etc.)
    │   └── css/                    # Component-specific styles
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── SocketContext.jsx
    │   └── CallContext.jsx         # WebRTC call state & signaling
    │
    ├── hooks/
    │   ├── useAuth.jsx
    │   └── useCall.jsx
    │
    ├── pages/
    │   ├── home/
    │   ├── login/
    │   ├── register/
    │   ├── chat/
    │   ├── profile/
    │   ├── about/
    │   └── contact/
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

| Technology                 | Purpose                            |
| -------------------------- | ---------------------------------- |
| React 18                   | UI library                         |
| Vite                       | Build tool & dev server            |
| React Router               | Client-side routing                |
| Context API + custom hooks | Global state (auth, socket, calls) |
| socket.io-client           | Real-time events                   |
| Axios                      | HTTP requests                      |
| Native WebRTC              | Audio / video calls                |
| Custom CSS                 | Styling                            |

**No extra WebRTC libraries** are used (`simple-peer`, `peerjs`, etc. are not required).

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `Vibe-frontend/`:

```env
VITE_API_URL=http://localhost:3000

# Metered.ca TURN credentials (required for reliable calls behind NAT)
VITE_TURN_USERNAME=your_metered_username
VITE_TURN_CREDENTIAL=your_metered_credential
```

> Only variables prefixed with `VITE_` are exposed to the browser.

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

## 🔑 Authentication Flow

1. User registers or logs in → receives JWT.
2. Token is stored (usually in memory / localStorage via AuthContext).
3. Axios instance automatically attaches `x-auth-token` header.
4. Socket.io connection is opened with the same token in `auth`.
5. Protected routes are wrapped with `ProtectedRoute`.

---

## 📞 WebRTC Calling Architecture

### Key files

- `src/context/CallContext.jsx` – call state, peer connection, signaling
- `src/components/VideoCall.jsx` – full-screen UI + media element attachment
- `src/components/IncommingCallModel.jsx` – accept / reject UI
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

| Component            | Role                                            |
| -------------------- | ----------------------------------------------- |
| `Sidebar`            | Conversation list, search, new chat/group       |
| `ChatWindow`         | Message list, input, reactions, attachments     |
| `VideoCall`          | Full-screen call overlay (remote + local video) |
| `IncommingCallModel` | Incoming call accept/reject dialog              |
| Various modals       | New group, add member, edit profile, etc.       |

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

- The call UI only mounts when `call.status` is not `"idle"`.
- Video elements use **callback refs** so streams are attached reliably even with React 18 StrictMode and timing races.
- Remote video is kept muted by default to satisfy browser autoplay policies; you can unmute after a user gesture if desired.
- All real-time features (messages, typing, presence, calls) share the same Socket.io connection managed by `SocketContext`.
