'use client';

import { Agent } from '@/lib/types';

const STATUS_CONFIG: Record<string, { color: string; dot: string; label: string; icon: string }> = {
  idle:    { color: 'text-slate-400', dot: '#64748b', label: 'Idle',       icon: '○' },
  working: { color: 'text-green-400', dot: '#4ade80', label: 'Working',    icon: '▶' },
  meeting: { color: 'text-purple-400', dot: '#a78bfa', label: 'In Meeting', icon: '◆' },
  break:   { color: 'text-yellow-400', dot: '#fbbf24', label: 'On Break',   icon: '◉' },
};

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
  CEO:       { bg: 'rgba(147,51,234,0.2)',  text: '#c4b5fd' },
  Developer: { bg: 'rgba(37,99,235,0.2)',   text: '#93c5fd' },
  Designer:  { bg: 'rgba(219,39,119,0.2)',  text: '#f9a8d4' },
  QA:        { bg: 'rgba(234,88,12,0.2)',   text: '#fdba74' },
  Intern:    { bg: 'rgba(107,114,128,0.2)', text: '#d1d5db' },
};

interface Props {
  agents: Agent[];
}

export default function AgentList({ agents }: Props) {
  return (
    <div className="space-y-2.5">
      {agents.map((agent) => {
        const status = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
        const role = ROLE_STYLE[agent.role] ?? ROLE_STYLE.Intern;

        return (
          <div
            key={agent.id}
            className="rounded-xl p-3 transition-all duration-200 hover:scale-[1.01] group"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar with glow */}
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    backgroundColor: agent.color,
                    boxShadow: `0 0 16px ${agent.color}60, 0 0 32px ${agent.color}20`,
                  }}
                >
                  {agent.avatar}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                  style={{
                    backgroundColor: status.dot,
                    borderColor: '#020817',
                    boxShadow: `0 0 6px ${status.dot}`,
                  }}
                />
              </div>

              {/* Name & role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm">{agent.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: role.bg, color: role.text }}
                  >
                    {agent.role}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-xs ${status.color}`}>{status.icon}</span>
                  <span className={`text-xs ${status.color}`}>{status.label}</span>
                </div>
              </div>
            </div>

            {/* Task progress */}
            {agent.task && (
              <div
                className="mt-2.5 rounded-lg p-2.5"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Current Task</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: agent.color }}
                  >
                    {Math.round(agent.task.progress)}%
                  </span>
                </div>
                <p className="text-xs text-slate-200 truncate mb-2">{agent.task.title}</p>

                {/* Progress bar */}
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="h-full rounded-full relative overflow-hidden transition-all duration-500"
                    style={{
                      width: `${agent.task.progress}%`,
                      background: `linear-gradient(90deg, ${agent.color}cc, ${agent.color})`,
                      boxShadow: `0 0 8px ${agent.color}80`,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {!agent.task && agent.status === 'idle' && (
              <p className="mt-2 text-[11px] text-slate-600 italic px-0.5">Waiting for task assignment...</p>
            )}
            {!agent.task && agent.status === 'meeting' && (
              <p className="mt-2 text-[11px] text-purple-500 px-0.5">◆ In meeting session</p>
            )}
            {!agent.task && agent.status === 'break' && (
              <p className="mt-2 text-[11px] text-yellow-500 px-0.5">☕ Taking a break</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
