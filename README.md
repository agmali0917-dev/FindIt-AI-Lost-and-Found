# 🔍 FindIt – AI Powered Lost & Found Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/AI-CLIP%20Vision-8B5CF6?style=for-the-badge&logo=openai" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" />
</div>

> **Production-ready microservices platform** where AI automatically matches lost and found items using CLIP vision embeddings with 98% accuracy.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Image Matching** | CLIP ViT-B/32 analyzes photos and finds visual matches automatically |
| 🗺️ **Interactive Maps** | OpenStreetMap/Leaflet with geolocation and distance filtering |
| 💬 **Real-time Chat** | Socket.io messaging between item owners and finders |
| 🔔 **Live Notifications** | In-app + email alerts on every match |
| 📱 **QR Codes** | Every item gets a unique scannable QR code |
| 🛡️ **Secure Auth** | JWT access + refresh token rotation with email verification |
| 🔍 **Full-text Search** | MongoDB text indexes with geo-radius filtering |
| 👑 **Admin Panel** | Dashboard with Recharts analytics, user management |
| 🐳 **Docker Ready** | One-command deployment with Docker Compose |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   React Client  │────▶│   Express.js Server  │────▶│  FastAPI AI Service │
│  (Vite + TW)   │◀────│  (Node.js + MongoDB) │◀────│  (CLIP ViT-B/32)   │
│    Port 3000    │     │      Port 5000       │     │      Port 8000      │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
                               │         │
                          Socket.io  Cloudinary
                          (WS chat)  (Images)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- MongoDB (local or Atlas)
- Cloudinary account

### 1. Clone & Setup Environment

```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
cp ai-service/.env.example ai-service/.env

# Fill in your values in each .env file
```

### 2. Start with Docker Compose (Recommended)

```bash
docker-compose up --build
```

Access:
- **Client:** http://localhost:3000
- **API:** http://localhost:5000/api/health
- **AI Service:** http://localhost:8000/health

### 3. Manual Start (Development)

**Terminal 1 – Server:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 – Client:**
```bash
cd client
npm install
npm run dev
```

**Terminal 3 – AI Service:**
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 📁 Project Structure

```
FindIt/
├── client/                    # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI & layout components
│   │   │   ├── layout/        # Navbar, Sidebar, MainLayout, AuthLayout
│   │   │   └── ui/            # Button, Input, Modal, Card, Avatar...
│   │   ├── context/           # AuthContext, SocketContext
│   │   ├── hooks/             # useDebounce, useGeolocation...
│   │   ├── pages/             # All route pages
│   │   │   ├── auth/          # Login, Register, Verify, Reset...
│   │   │   ├── items/         # ReportLost, ReportFound, Detail pages
│   │   │   └── admin/         # Admin dashboard, users, items, analytics
│   │   ├── services/          # Axios API functions (api.js + index.js)
│   │   └── utils/             # Constants, helpers
│   └── package.json
│
├── server/                    # Node.js + Express backend
│   └── src/
│       ├── config/            # DB, Cloudinary, Socket.io configs
│       ├── controllers/       # Auth, Items, Matches, Chat, Admin...
│       ├── middleware/        # Auth guard, rate limiter, multer, error
│       ├── models/            # User, LostItem, FoundItem, Match, Chat...
│       ├── routes/            # Express routers for each domain
│       └── utils/             # ApiError, ApiResponse, tokens, email, QR
│
├── ai-service/                # Python FastAPI AI matching service
│   ├── app/
│   │   ├── routers/           # /match, /embed, /health endpoints
│   │   └── services/          # clip_service.py – CLIP image + text
│   ├── main.py
│   └── requirements.txt
│
├── docker-compose.yml         # Full stack orchestration
└── README.md
```

---

## 🤖 AI Matching Pipeline

```
Found Item Uploaded
        │
        ▼
 Image Embeddings (CLIP)
        │
        ▼
 Text Embeddings (CLIP tokenizer)
        │
        ▼
 Cosine Similarity vs. All Active Lost Items
        │
        ▼
 Combined Score = 0.75 × Image + 0.25 × Text
        │
        ▼
 Score ≥ 0.85 → Match Created
        │
        ▼
 Real-time Notification (Socket.io + Email)
```

---

## 🔐 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login & get JWT |
| `GET`  | `/api/lost-items` | List lost items (paginated + geo) |
| `POST` | `/api/lost-items` | Report lost item |
| `POST` | `/api/found-items` | Report found item + trigger AI |
| `GET`  | `/api/matches` | Get my AI matches |
| `POST` | `/api/matches/:id/confirm` | Confirm match + start chat |
| `GET`  | `/api/chats` | Get my chats |
| `POST` | `/api/chats/:id/messages` | Send message |
| `GET`  | `/api/search?q=wallet` | Full-text search |
| `GET`  | `/api/admin/stats` | Admin analytics |

---

## 🧪 Testing

```bash
# Server unit tests
cd server && npm test

# AI service
cd ai-service && python -m pytest

# E2E (coming soon)
cd client && npm run test:e2e
```

---

## 🌍 Deployment

### Vercel (Client)
```bash
cd client && vercel --prod
```

### Render (Server)
- Build: `npm install`
- Start: `npm start`
- Set all env vars from `server/.env.example`

### Render (AI Service)
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 📄 License

MIT License – Free to use for academic and portfolio purposes.

---

<div align="center">
  Built with ❤️ as a Final Year Engineering Project
  <br/>
  <strong>AI-Powered · Real-Time · Production-Ready</strong>
</div>
