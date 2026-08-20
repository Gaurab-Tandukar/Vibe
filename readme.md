# Vibe

A full-stack real-time chat application with private & group messaging, reactions, file attachments, live notifications, typing indicators, online presence, and **WebRTC audio/video calling**.

---

## ✨ Core Functionality

| Feature                 | Description                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Authentication**      | Register / Login with JWT (`x-auth-token`)                                     |
| **Private Chat**        | 1-on-1 conversations (duplicate prevention)                                    |
| **Group Chat**          | Named groups with admin roles, add/remove members, leave group, admin transfer |
| **Messaging**           | Real-time text messages, edit, soft-delete, reply context preserved            |
| **Reactions**           | Emoji reactions on messages (toggle)                                           |
| **Attachments**         | Image, PDF and other file uploads                                              |
| **Notifications**       | Real-time + grouped unread notifications                                       |
| **Presence**            | Online / offline status + typing indicators                                    |
| **Read Receipts**       | `readBy` tracking on messages                                                  |
| **Audio / Video Calls** | WebRTC 1-1 calls with mute, camera toggle, and TURN fallback                   |

---

## 🧰 Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.io
- **Auth**: JWT + bcrypt
- **File Uploads**: Multer (local storage → ready for Cloudinary)
- **Encryption**: Custom message encryption utility

### Frontend

- **Framework**: React 18 + Vite
- **Routing**: React Router
- **State**: React Context + custom hooks
- **Styling**: Custom CSS
- **Real-time**: socket.io-client
- **Media**: Native WebRTC (`RTCPeerConnection`, `getUserMedia`)

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
```

Start the backend:

```bash
npm run dev
```

API will be available at `http://localhost:3000`.

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

| Module        | Base Route           | Key Endpoints                                 |
| ------------- | -------------------- | --------------------------------------------- |
| Users         | `/api/users`         | register, login, profile, avatar, password    |
| Conversations | `/api/chat`          | create private/group, list, add/remove member |
| Messages      | `/api/messages`      | create, paginated get, edit, soft-delete      |
| Reactions     | `/api/reactions`     | add/toggle, get by message                    |
| Attachments   | `/api/attachments`   | upload, get by message                        |
| Notifications | `/api/notifications` | list (grouped), unread count, mark read       |

Static files are served from:

```
http://localhost:3000/uploads/<avatars|attachments|...>/<filename>
```

---

## 🔌 Real-Time Events (Socket.io)

| Event                                                                            | Direction       | Description                       |
| -------------------------------------------------------------------------------- | --------------- | --------------------------------- |
| `joinConversation`                                                               | client → server | Join a conversation room          |
| `leaveConversation`                                                              | client → server | Leave a conversation room         |
| `newMessage`                                                                     | server → client | New message broadcast             |
| `newNotification`                                                                | server → client | Personal notification             |
| `call:invite` / `call:offer` / `call:answer` / `call:ice-candidate` / `call:end` | both            | WebRTC signaling                  |
| Typing & presence events                                                         | both            | Online status + typing indicators |

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
