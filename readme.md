# Vibe

A full-stack real-time chat application with private & group messaging, reactions, file attachments, live notifications, typing indicators, online presence, and **WebRTC audio/video calling**.

---

## ✨ Features

| Feature                 | Description                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **Authentication**      | Register / Login with JWT (`x-auth-token`); guest routes redirect logged-in users   |
| **Private Chat**        | 1-on-1 conversations with duplicate prevention                                      |
| **Group Chat**          | Named groups with admin roles, add/remove members, leave group, admin transfer      |
| **Messaging**           | Real-time text messages, edit, soft-delete, reply context preserved                 |
| **Reactions**           | Emoji reactions on messages (toggle)                                                |
| **Attachments**         | Image, PDF and other file uploads                                                   |
| **Notifications**       | Real-time + grouped unread notifications                                            |
| **Presence**            | Online / offline status + typing indicators                                         |
| **Read Receipts**       | `readBy` tracking on messages                                                       |
| **Audio / Video Calls** | WebRTC 1-1 calls with mute, camera toggle, and TURN fallback                        |
| **Profiles**            | Avatar, banner, bio — view and edit your own or others' profiles                    |
| **Legal Pages**         | Privacy Policy and Terms of Service pages                                           |

---

## 🧰 Tech Stack

### Backend

| Technology         | Version | Purpose                                       |
| ------------------ | ------- | --------------------------------------------- |
| Node.js            | 18+     | Runtime                                       |
| Express.js         | ^5.2    | HTTP API framework                            |
| MongoDB + Mongoose | ^9.8    | Database & ODM                                |
| Socket.io          | ^4.8    | Real-time messaging, presence, call signaling |
| JWT + bcrypt       | —       | Authentication & password hashing             |
| Multer             | ^2.2    | File uploads (local storage)                  |
| dotenv             | ^17.4   | Environment variable management               |

### Frontend

| Technology              | Version | Purpose                            |
| ----------------------- | ------- | ---------------------------------- |
| React                   | ^19.2   | UI library                         |
| Vite                    | ^8.2    | Build tool & dev server            |
| React Router DOM        | ^7.18   | Client-side routing                |
| socket.io-client        | ^4.8    | Real-time events                   |
| Axios                   | ^1.19   | HTTP requests                      |
| Bootstrap 5             | ^5.3    | UI component base & layout         |
| Bootstrap Icons         | ^1.13   | Icon set                           |
| Font Awesome            | ^7.3    | Additional icons                   |
| Native WebRTC           | —       | Audio / video peer-to-peer calls   |
| Context API             | —       | Global state (auth, socket, calls) |

### External Services

| Service                      | Purpose             | Notes                                         |
| ---------------------------- | ------------------- | --------------------------------------------- |
| **MongoDB Atlas** (or local) | Database            | Connection string in `.env`                   |
| **Metered.ca**               | STUN / TURN servers | Required for reliable WebRTC calls behind NAT |
| **Google STUN**              | Free fallback STUN  | `stun:stun.l.google.com:19302`                |

---

## 📁 Project Structure

```
Vibe/
├── Vibe-backend-api/     # Express + Socket.io + MongoDB
├── Vibe-frontend/        # React + Vite
├── .gitignore
└── README.md             # ← you are here
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Gaurab-Tandukar/Vibe.git
cd Vibe
```

### 2. Backend setup

```bash
cd Vibe-backend-api
npm install
```

Create `.env` inside `Vibe-backend-api/`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
# Optional – lock CORS to your deployed frontend URL
CLIENT_URL=https://your-frontend-domain.com
```

Start the backend:

```bash
npm run dev    # development (nodemon)
npm start      # production
```

API available at `http://localhost:3000`.

### 3. Frontend setup

```bash
cd ../Vibe-frontend
npm install
```

Create `.env` inside `Vibe-frontend/`:

```env
VITE_API_URL=http://localhost:3000
VITE_TURN_USERNAME=your_metered_username
VITE_TURN_CREDENTIAL=your_metered_credential
```

Start the frontend:

```bash
npm run dev
```

App will be available at `http://localhost:5173`.

---

## 🔑 Authentication

- Protected HTTP routes require header: `x-auth-token: <jwt>`
- Obtain token via:
  - `POST /api/users/register`
  - `POST /api/users/login`
- Socket.io connections authenticate with the same JWT:
  ```js
  io("http://localhost:3000", { auth: { token: "<jwt>" } });
  ```

---

## 📡 API Overview

| Module        | Base Route           | Key Endpoints                                    |
| ------------- | -------------------- | ------------------------------------------------ |
| Users         | `/api/users`         | register, login, profile, avatar, password       |
| Conversations | `/api/chats`         | create private/group, list, add/remove member    |
| Messages      | `/api/messages`      | create, paginated get, edit, soft-delete         |
| Reactions     | `/api/reactions`     | add/toggle, get by message                       |
| Attachments   | `/api/attachments`   | upload, get by message                           |
| Notifications | `/api/notifications` | list (grouped), unread count, mark read          |

Static files are served from:

```
http://localhost:3000/uploads/<avatars|attachments|banners|groupAvatars>/<filename>
```

---

## 🔌 Real-Time Events (Socket.io)

### Messaging & Presence

| Event                    | Direction | Description                       |
| ------------------------ | --------- | --------------------------------- |
| `joinConversation`       | C → S     | Join a conversation room          |
| `leaveConversation`      | C → S     | Leave a conversation room         |
| `newMessage`             | S → C     | New message broadcast             |
| `newNotification`        | S → C     | Personal notification push        |
| Typing / presence events | both      | Online status + typing indicators |

### WebRTC Call Signaling

| Event                           | Direction | Description                    |
| ------------------------------- | --------- | ------------------------------ |
| `call:invite`                   | C → S → C | Notify callee of incoming call |
| `call:offer`                    | C → S → C | SDP offer                      |
| `call:answer`                   | C → S → C | SDP answer                     |
| `call:ice-candidate`            | C → S → C | ICE candidate exchange         |
| `call:accept` / `call:accepted` | both      | Call accepted                  |
| `call:reject` / `call:rejected` | both      | Call rejected / busy           |
| `call:end`                      | both      | Hang up                        |
| `call:unavailable`              | S → C     | Callee offline                 |

---

## 🗄️ Business Rules (Quick Reference)

**Private Chat**

- Exactly one other member, `isGroup: false`
- Duplicate private conversations are prevented

**Group Chat**

- Requires a name, creator becomes `admin`
- Only admins can add/remove members
- Members can leave; admin transfer supported

**Messages**

- Soft-deleted messages are masked (`"This message was deleted"`)
- Edited messages set `isEdited: true`

**Notifications**

- One notification per recipient per message
- Grouped at read-time (conversations with 4+ unread collapse)

**Calls**

- 1-1 audio or video via WebRTC
- Signaling over existing Socket.io connection
- TURN fallback via Metered.ca when direct P2P fails

---

## 📄 License

This project is for educational / portfolio purposes.
