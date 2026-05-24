'use client';

import { Agent, Task } from '@/lib/types';

interface Props {
  agents: Agent[];
  tasks: Task[];
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  glowColor: string;
  icon: string;
  sublabel?: string;
}

function StatCard({ label, value, color, glowColor, icon, sublabel }: StatCardProps) {
  return (
    <div
      className="relative rounded-2xl p-4 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: `0 0 30px ${glowColor}10`,
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20 blur-xl"
        style={{ backgroundColor: glowColor }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-1">
          <span className="text-lg leading-none">{icon}</span>
        </div>
        <p
          className="text-3xl font-bold tabular-nums mt-1"
          style={{ color, textShadow: `0 0 20px ${glowColor}60` }}
        >
          {value}
        </p>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-slate-600 mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

export default function StatsBar({ agents, tasks }: Props) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const working = agents.filter(a => a.status === 'working').length;
  const inMeeting = agents.filter(a => a.status === 'meeting').length;
  const onBreak = agents.filter(a => a.status === 'break').length;
  const idle = agents.filter(a => a.status === 'idle').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard label="Total Tasks"  value={total}      color="#e2e8f0" glowColor="#e2e8f0" icon="📋" />
      <StatCard label="Completed"    value={completed}  color="#4ade80" glowColor="#4ade80" icon="✅" sublabel={`${completionRate}% done`} />
      <StatCard label="In Progress"  value={inProgress} color="#fbbf24" glowColor="#fbbf24" icon="⚡" />
      <StatCard label="Pending"      value={pending}    color="#94a3b8" glowColor="#94a3b8" icon="⏳" />
      <StatCard label="Working"      value={working}    color="#60a5fa" glowColor="#60a5fa" icon="💻" sublabel={`${inMeeting} meeting`} />
      <StatCard label="Idle"         value={idle}       color="#475569" glowColor="#475569" icon="○" sublabel={`${onBreak} on break`} />
    </div>
  );
}
