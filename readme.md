# Vibe

A real-time chat application backend + frontend supporting private and group conversations, message reactions, attachments, and live notifications.

---

## 🧰 Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (real-time messaging & notifications)
- JWT Authentication (`x-auth-token` header)
- bcrypt (password hashing)
- Multer (file uploads — avatars & attachments)

**Frontend**
- *(add your framework here, e.g. React + Vite)*

---

## 📁 Project Structure

```
Vibe/
├── Vibe-backend-api/
│   ├── config/
│   │   └── dbConfig.js          # MongoDB connection
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── conversationController.js
│   │   ├── messageController.js
│   │   ├── reactionController.js
│   │   ├── attachmentController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # protect + authorize
│   │   └── uploadMiddleware.js   # reusable multer factory
│   ├── model/
│   │   ├── userModel.js
│   │   ├── conversationModel.js
│   │   ├── conversationMemberModel.js
│   │   ├── messageModel.js
│   │   ├── reactionModel.js
│   │   ├── AttachmentModel.js
│   │   └── notificationModel.js
│   ├── routes/
│   │   ├── userRoute.js
│   │   ├── conversationRoute.js
│   │   ├── messageRoute.js
│   │   ├── reactionRoute.js
│   │   ├── attachmentRoute.js
│   │   └── notificationRoute.js
│   ├── socket/
│   │   └── socketHandler.js      # socket auth, rooms, live events
│   ├── uploads/                  # gitignored — local file storage
│   │   ├── avatars/
│   │   └── attachments/
│   ├── util/
│   │   ├── password.js
│   │   └── jwtToken.js
│   ├── server.js
│   ├── package.json
│   └── .env                      # gitignored
│
├── Vibe-frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started (Local Setup)

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/Vibe.git
cd Vibe
```

### 2. Backend setup

```bash
cd Vibe-backend-api
npm install
```

Create a `.env` file inside `Vibe-backend-api/`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
```

Run the backend:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

### 3. Frontend setup

```bash
cd ../Vibe-frontend
npm install
npm run dev
```

---

## 🔑 Authentication

- All protected routes require an `x-auth-token` header containing a valid JWT.
- Obtain a token via `POST /api/users/register` or `POST /api/users/login`.
- Socket.io connections authenticate using the same JWT, passed via:
  ```js
  io("http://localhost:3000", { auth: { token: "<jwt>" } })
  ```

---

## 📡 API Overview

| Module | Base Route | Key Endpoints |
|---|---|---|
| Users | `/api/users` | register, login, profile, avatar upload, password update |
| Conversations | `/api/chat` | create (private/group), get mine, get by id, add/remove member |
| Messages | `/api/messages` | create, get (paginated), edit, delete (soft) |
| Reactions | `/api/reactions` | add/toggle, get by message |
| Attachments | `/api/attachments` | upload, get by message |
| Notifications | `/api/notifications` | get (grouped), unread count, mark read |

Static uploaded files (avatars/attachments) are served from:
```
http://localhost:3000/uploads/<avatars|attachments>/<filename>
```

---

## 🔌 Real-Time Events (Socket.io)

| Event | Direction | Description |
|---|---|---|
| `joinConversation` | client → server | Join a conversation's room |
| `leaveConversation` | client → server | Leave a conversation's room |
| `newMessage` | server → client | Broadcast when a message is sent |
| `newNotification` | server → client | Pushed to a specific online recipient |

---

## 🗄️ Business Rules (Quick Reference)

**Private Chat**
- `isGroup: false`, exactly 1 other member
- No admin role; duplicate private conversations are prevented

**Group Chat**
- `isGroup: true`, requires a `name`
- Creator becomes `admin`; others become `member`
- Only admins can add/remove members

**Messages**
- Soft-deleted messages are masked (`"This message was deleted"`), not removed, to preserve conversation order and reply context
- Edited messages set `isEdited: true`

**Notifications**
- One notification is created per recipient per message
- Grouped at read-time: conversations with more than 4 unread notifications collapse into a single "4+ messages from X" summary

---

## 🛣️ Roadmap / Known Next Steps

- [ ] Typing indicators & online presence via sockets -- done --
- [ ] Read receipts (`readBy` tracking on messages) -- done --
- [ ] Leave group (self-service, non-admin) -- done --
- [ ] Admin transfer / adminless-group handling -- done --
- [ ] Move file storage to Cloudinary before deployment
- [ ] Rate limiting on auth & message endpoints
- [ ] Lock CORS to production frontend URL

---
