# HermesOffice 🏢

**3D Virtual Office for AI Agent Monitoring** — Built with Vue 3 + TresJS + FastAPI + Socket.IO

A real-time 3D office visualization where you can see your AI agents working, chatting, and completing tasks in a virtual workspace.

![HermesOffice](https://img.shields.io/badge/Vue-3-42b883?style=flat-square&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=flat-square&logo=socket.io)

## Features

- 🧑‍💻 **3D Humanoid Agents** — Low-poly robot avatars animated in real-time
- 🔔 **Sound Effects** — Web Audio API notifications for task events
- 🏠 **Multi-Room Navigation** — 4 rooms: Main Office, Server Room, Meeting Room, Kitchen
- 📊 **Agent Dashboard** — Stats, activity log, and timeline sidebar
- 🔌 **Hermes Gateway Integration** — Connect to real Hermes Agent or use demo simulation
- 🌙 **Dark Theme** — Indigo accent (#6366f1) on deep navy (#0a0f1a)

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vue 3, Vite, TypeScript, TresJS (Three.js), Tailwind CSS |
| Backend | FastAPI, Python-SocketIO, uvicorn |
| Real-time | Socket.IO |
| 3D | TresJS + Three.js |
| Deployment | Nginx reverse proxy |

## Quick Start

### Frontend

```bash
cd HermesOffice
npm install
npm run dev        # Development
npm run build      # Production build
```

### Backend

```bash
cd HermesOffice/backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
HERMES_SIMULATION=true python main.py  # Demo mode
```

> Set `HERMES_SIMULATION=false` and configure `HERMES_GATEWAY_URL` to connect to real Hermes Agent.

### Nginx Proxy (for production)

```nginx
server {
    listen 8090;
    location / {
        proxy_pass http://127.0.0.1:5173;
    }
}
server {
    listen 8091;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/hermes/status` | Gateway connection status |
| WS | `/socket.io/` | Real-time agent events |

## Agent Event Types

- `status_change` — Agent status updates (idle → working → complete)
- `task_start` — Agent begins a task
- `task_complete` — Agent finishes a task
- `message` — Inter-agent messaging

## Rooms

| Room | Position |
|------|----------|
| Main Office | (0, 0, 0) |
| Server Room | (-15, 0, 0) |
| Meeting Room | (15, 0, 0) |
| Kitchen | (0, 0, 15) |

## Project Structure

```
HermesOffice/
├── src/
│   ├── components/
│   │   ├── office/Office3D.vue    # 3D scene
│   │   └── dashboard/AgentPanel.vue # Sidebar
│   ├── composables/
│   │   ├── useOfficeSocket.ts     # Socket.IO connection
│   │   └── useSound.ts            # Web Audio API sounds
│   └── types/index.ts              # TypeScript interfaces
├── backend/
│   └── main.py                     # FastAPI + Socket.IO server
└── public/
```

## License

MIT — [andrizpray/Hermes-office](https://github.com/andrizpray/Hermes-office)
