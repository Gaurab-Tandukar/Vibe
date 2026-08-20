# Vibe Backend API

Express + Socket.io + MongoDB backend for the Vibe real-time chat & calling application.

---

## 📁 Folder Structure

```
Vibe-backend-api/
├── .env                        # Environment variables (gitignored)
├── .gitignore
├── package.json
├── package-lock.json
├── server.js                   # Entry point – starts Express + Socket.io
│
├── config/
│   └── dbConfig.js             # MongoDB connection
│
├── controllers/
│   ├── attachmentController.js
│   ├── conversationController.js
│   ├── messageController.js
│   ├── notificationController.js
│   ├── reactionController.js
│   └── userController.js
│
├── middleware/
│   ├── authMiddleware.js       # JWT protect + authorize
│   ├── Errorhandler.js         # Global error handler
│   └── uploadMiddleware.js     # Reusable Multer factory
│
├── model/
│   ├── attachmentModel.js
│   ├── conversationMemberModel.js
│   ├── conversationModel.js
│   ├── messageModel.js
│   ├── notificationModel.js
│   ├── reactionModel.js
│   └── userModel.js
│
├── routes/
│   ├── attachmentRoute.js
│   ├── conversationRoute.js
│   ├── messageRoute.js
│   ├── notificationRoute.js
│   ├── reactionRoute.js
│   └── userRoute.js
│
├── socket/
│   └── socketHandler.js        # Socket auth, rooms, messaging & call signaling
│
├── scripts/
│   └── encryptExistingMessages.js
│
├── util/
│   ├── encryption.js           # Message encryption helpers
│   ├── jwtToken.js             # JWT sign / verify
│   └── password.js             # bcrypt helpers
│
└── uploads/                    # Local file storage (gitignored)
    ├── attachments/
    ├── avatars/
    ├── banners/
    └── groupAvatars/
```

---

## 🧰 Tech Stack

| Technology         | Purpose                                       |
| ------------------ | --------------------------------------------- |
| Node.js + Express  | HTTP API                                      |
| MongoDB + Mongoose | Database & ODM                                |
| Socket.io          | Real-time messaging, presence, call signaling |
| JWT                | Authentication                                |
| bcrypt             | Password hashing                              |
| Multer             | File uploads                                  |
| dotenv             | Environment variables                         |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `Vibe-backend-api/`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/vibe
# or MongoDB Atlas connection string

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=30d
```

---

## 🚀 Getting Started

```bash
cd Vibe-backend-api
npm install
npm run dev          # starts with nodemon (or whatever script you defined)
```

Server runs at `http://localhost:3000`.

---

## 🔐 Authentication

All protected routes require the header:

```
x-auth-token: <JWT>
```

Socket.io connections also authenticate with the same token:

```js
io("http://localhost:3000", {
  auth: { token: "<JWT>" },
});
```

---

## 📡 HTTP API Routes

| Base Path            | Description                                       |
| -------------------- | ------------------------------------------------- |
| `/api/users`         | Register, login, profile, avatar, password update |
| `/api/chat`          | Conversations (private & group), members          |
| `/api/messages`      | Create, list (paginated), edit, soft-delete       |
| `/api/reactions`     | Add / toggle reactions                            |
| `/api/attachments`   | Upload & retrieve files                           |
| `/api/notifications` | List, unread count, mark as read                  |

Static uploads are served at:

```
http://localhost:3000/uploads/<folder>/<filename>
```

---

## 🔌 Socket.io Events

### Messaging & Presence

| Event                    | Direction | Description                       |
| ------------------------ | --------- | --------------------------------- |
| `joinConversation`       | C → S     | Join a conversation room          |
| `leaveConversation`      | C → S     | Leave a conversation room         |
| `newMessage`             | S → C     | Broadcast new message             |
| `newNotification`        | S → C     | Push notification to a user       |
| Typing / presence events | both      | Online status & typing indicators |

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

## 🗄️ Key Models (Overview)

- **User** – profile, password hash, avatar, online status
- **Conversation** – private or group, name, members reference
- **ConversationMember** – role (`admin` / `member`), join date
- **Message** – text, sender, conversation, soft-delete, edit flag, readBy
- **Reaction** – emoji + user + message
- **Attachment** – file metadata linked to message
- **Notification** – type, recipient, related message/conversation, read status

---

## 🛡️ Middleware

- `authMiddleware` – verifies JWT and attaches `req.user`
- `uploadMiddleware` – configurable Multer instance (avatars, attachments, etc.)
- Global error handler – consistent JSON error responses

---

## 📦 Scripts

```bash
npm run dev          # Development server
# node scripts/encryptExistingMessages.js   # One-time migration helper
```

---

## 📝 Notes

- Messages support soft-delete so conversation order and reply context stay intact.
- Group notifications are collapsed on the client when a conversation has many unread items.
- File storage is currently local (`uploads/`). Ready to be swapped for Cloudinary or S3.
- CORS should be locked to the production frontend URL before deployment.
