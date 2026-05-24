# 🏢 AI Office Simulator

Real-time multi-agent office simulation dashboard with glassmorphism UI.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- **Real-time Agent Simulation** — 5 AI agents moving between office rooms autonomously
- **Live SSE Streaming** — Updates every 500ms via Server-Sent Events
- **Glassmorphism UI** — Dark theme with blur effects and gradient glows
- **Office Map** — Visual room layout with agents, desks, and status colors
- **Task Management** — Auto-assigned tasks with progress tracking
- **Activity Log** — Color-coded event stream with timestamps

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── api/office/
│   │   ├── route.ts        # GET /api/office - reset simulation
│   │   └── stream/route.ts # GET /api/office/stream - SSE stream
│   ├── globals.css         # Glassmorphism styles
│   ├── layout.tsx
│   └── page.tsx            # Main dashboard
├── components/
│   ├── ActivityLog.tsx      # Event log with color coding
│   ├── AgentList.tsx        # Agent cards with progress
│   ├── OfficeMap.tsx        # Visual office grid
│   └── StatsBar.tsx         # Live metrics
└── lib/
    ├── office-store.ts      # Simulation state + tick logic
    └── types.ts             # TypeScript interfaces
```

## Agent Roles

| Agent | Role | Color |
|-------|------|-------|
| Alice | CEO | Purple |
| Bob | Developer | Blue |
| Carol | Designer | Pink |
| Dave | QA | Orange |
| Eve | Intern | Gray |

## License

MIT
