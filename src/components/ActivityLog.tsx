'use client';

import { LogEntry } from '@/lib/types';

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  info:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', icon: '○', label: 'INFO' },
  task:  { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  icon: '✓', label: 'TASK' },
  move:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  icon: '→', label: 'MOVE' },
  alert: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  icon: '!', label: 'ALERT' },
};

interface Props {
  logs: LogEntry[];
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

export default function ActivityLog({ logs }: Props) {
  return (
    <div
      className="h-full flex flex-col rounded-2xl p-4"
      style={{
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-green-400 to-blue-500" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">Activity Log</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
            style={{ boxShadow: '0 0 6px #4ade80' }}
          />
          <span className="text-xs text-slate-500">{logs.length} events</span>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin min-h-0">
        {logs.length === 0 && (
          <p className="text-xs text-slate-600 italic text-center py-6">Waiting for activity...</p>
        )}
        {logs.map((log) => {
          const cfg = TYPE_CONFIG[log.type] ?? TYPE_CONFIG.info;
          return (
            <div
              key={log.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/[0.02]"
              style={{ borderLeft: `2px solid ${cfg.color}40` }}
            >
              {/* Type badge */}
              <span
                className="shrink-0 text-[10px] font-bold w-4 text-center"
                style={{ color: cfg.color }}
              >
                {cfg.icon}
              </span>

              {/* Message */}
              <span className="flex-1 min-w-0 truncate" style={{ color: cfg.color }}>
                {log.message}
              </span>

              {/* Time */}
              <span className="text-slate-600 shrink-0 tabular-nums">{timeAgo(log.timestamp)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
