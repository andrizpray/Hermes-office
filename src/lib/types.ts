export type AgentRole = 'CEO' | 'Developer' | 'Designer' | 'QA' | 'Intern';
export type AgentStatus = 'idle' | 'working' | 'meeting' | 'break';
export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  avatar: string;
  color: string;
  status: AgentStatus;
  currentRoom: RoomId;
  task: Task | null;
  x: number;
  y: number;
  speed: number;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignedAgent: string;
  progress: number;
  duration: number;
  startedAt: number | null;
}

export type RoomId = 'lobby' | 'dev' | 'meeting' | 'break' | 'server';

export interface Room {
  id: RoomId;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  desks: { x: number; y: number }[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'task' | 'move' | 'alert';
  agentId?: string;
}

export interface OfficeState {
  agents: Agent[];
  tasks: Task[];
  logs: LogEntry[];
  timestamp: number;
}
