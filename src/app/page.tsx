'use client';

import { useEffect, useState, useCallback } from 'react';
import OfficeMap from '@/components/OfficeMap';
import AgentList from '@/components/AgentList';
import ActivityLog from '@/components/ActivityLog';
import StatsBar from '@/components/StatsBar';
import { Agent, Task, LogEntry, Room } from '@/lib/types';

interface OfficeState {
  agents: Agent[];
  tasks: Task[];
  logs: LogEntry[];
  rooms: Room[];
  timestamp: number;
}

export default function Home() {
  const [state, setState] = useState<OfficeState | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const events = new EventSource('/api/office/stream');

    events.onopen = () => setConnected(true);
    events.onmessage = (e) => {
      try {
        setState(JSON.parse(e.data));
      } catch {}
    };
    events.onerror = () => {
      setConnected(false);
      events.close();
      setTimeout(connect, 2000);
    };

    return events;
  }, []);

  useEffect(() => {
    const events = connect();
    return () => events.close();
  }, [connect]);

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #9333ea 0%, #2563eb 100%)', boxShadow: '0 0 20px rgba(147,51,234,0.5)' }}>
                🏢
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                AI Office Simulator
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Real-time multi-agent monitoring dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Uptime */}
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500">Status</p>
              <p className="text-sm font-medium text-slate-300">
                {state ? `${state.agents.length} agents active` : 'Loading...'}
              </p>
            </div>

            {/* Connection badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${connected
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {connected ? 'Live' : 'Reconnecting...'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-5">
        {/* Stats Bar */}
        <StatsBar agents={state?.agents ?? []} tasks={state?.tasks ?? []} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Office Map */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-blue-400 to-purple-500" />
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">Office Floor</h2>
              </div>
              <div className="text-xs text-slate-500">
                {state?.rooms.length ?? 0} rooms
              </div>
            </div>

            <OfficeMap rooms={state?.rooms ?? []} agents={state?.agents ?? []} />

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs border-t border-white/5 pt-3">
              {[
                { color: 'bg-green-400', label: 'Working', glow: 'shadow-green-400/50' },
                { color: 'bg-purple-400', label: 'Meeting', glow: 'shadow-purple-400/50' },
                { color: 'bg-yellow-400', label: 'Break', glow: 'shadow-yellow-400/50' },
                { color: 'bg-slate-400', label: 'Idle', glow: 'shadow-slate-400/50' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent List */}
          <div className="glass-card rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-pink-400 to-orange-500" />
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">Agents</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                {state?.agents.length ?? 0} total
              </span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <AgentList agents={state?.agents ?? []} />
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="h-52">
          <ActivityLog logs={state?.logs ?? []} />
        </div>
      </main>
    </div>
  );
}
