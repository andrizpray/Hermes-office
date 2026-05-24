'use client';

import { Room, Agent } from '@/lib/types';

const ROOM_STYLES: Record<string, {
  bg: string; border: string; label: string; glow: string; icon: string;
}> = {
  lobby:   { bg: 'rgba(71,85,105,0.3)',   border: 'rgba(148,163,184,0.3)', label: '#94a3b8', glow: 'rgba(148,163,184,0.15)', icon: '🚪' },
  dev:     { bg: 'rgba(30,64,175,0.35)',  border: 'rgba(96,165,250,0.4)',  label: '#93c5fd', glow: 'rgba(37,99,235,0.2)',   icon: '💻' },
  meeting: { bg: 'rgba(109,40,217,0.35)', border: 'rgba(167,139,250,0.4)', label: '#c4b5fd', glow: 'rgba(124,58,237,0.2)', icon: '📋' },
  break:   { bg: 'rgba(6,78,59,0.4)',     border: 'rgba(52,211,153,0.4)',  label: '#6ee7b7', glow: 'rgba(5,150,105,0.2)',  icon: '☕' },
  server:  { bg: 'rgba(120,53,15,0.4)',   border: 'rgba(251,146,60,0.4)',  label: '#fdba74', glow: 'rgba(194,65,12,0.2)',  icon: '🖥️' },
};

const STATUS_RING: Record<string, string> = {
  working: '#4ade80',
  meeting: '#a78bfa',
  break:   '#fbbf24',
  idle:    '#64748b',
};

interface Props {
  rooms: Room[];
  agents: Agent[];
}

export default function OfficeMap({ rooms, agents }: Props) {
  return (
    <div className="relative w-full" style={{ height: 420 }}>
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(2,8,23,0.9) 0%, rgba(15,23,42,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Subtle grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Rooms */}
        {rooms.map((room) => {
          const style = ROOM_STYLES[room.id] ?? ROOM_STYLES.lobby;
          return (
            <div
              key={room.id}
              className="absolute rounded-xl"
              style={{
                left: room.x,
                top: room.y,
                width: room.width,
                height: room.height,
                background: style.bg,
                border: `1px solid ${style.border}`,
                boxShadow: `inset 0 0 30px ${style.glow}, 0 0 20px ${style.glow}`,
                backdropFilter: 'blur(4px)',
              }}
            >
              {/* Room header */}
              <div className="flex items-center gap-1 px-2 pt-1.5">
                <span className="text-[10px]">{style.icon}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: style.label }}
                >
                  {room.name}
                </span>
              </div>

              {/* Desks */}
              {room.desks.map((desk, i) => (
                <div
                  key={i}
                  className="absolute rounded"
                  style={{
                    left: desk.x,
                    top: desk.y + 18,
                    width: 28,
                    height: 20,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                />
              ))}
            </div>
          );
        })}

        {/* Agent avatars */}
        {agents.map((agent) => {
          const statusColor = STATUS_RING[agent.status] ?? '#64748b';
          return (
            <div
              key={agent.id}
              className="absolute flex items-center justify-center rounded-full text-[11px] font-bold"
              style={{
                left: agent.x - 14,
                top: agent.y - 14,
                width: 28,
                height: 28,
                backgroundColor: agent.color,
                boxShadow: `0 0 0 2px ${statusColor}60, 0 0 16px ${agent.color}80, 0 0 32px ${agent.color}30`,
                zIndex: 20,
                transition: 'left 0.4s linear, top 0.4s linear',
              }}
              title={`${agent.name} (${agent.role}) — ${agent.status}`}
            >
              <span className="text-white drop-shadow">{agent.avatar}</span>

              {/* Status dot */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: statusColor,
                  borderColor: '#020817',
                  boxShadow: `0 0 6px ${statusColor}`,
                  animation: agent.status === 'working' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
