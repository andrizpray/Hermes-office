import { Agent, Task, LogEntry, Room, RoomId, OfficeState, AgentRole } from './types';

const ROOMS: Room[] = [
  { id: 'lobby', name: 'Lobby', color: '#475569', x: 10, y: 10, width: 180, height: 120, desks: [] },
  { id: 'dev', name: 'Dev Room', color: '#1e40af', x: 10, y: 140, width: 180, height: 160, desks: [
    { x: 30, y: 30 }, { x: 90, y: 30 }, { x: 150, y: 30 },
    { x: 30, y: 90 }, { x: 90, y: 90 }, { x: 150, y: 90 },
  ]},
  { id: 'meeting', name: 'Meeting Room', color: '#7c3aed', x: 200, y: 10, width: 140, height: 120, desks: [
    { x: 40, y: 50 }, { x: 100, y: 50 },
  ]},
  { id: 'break', name: 'Break Room', color: '#065f46', x: 200, y: 140, width: 140, height: 160, desks: [
    { x: 30, y: 30 }, { x: 90, y: 30 },
  ]},
  { id: 'server', name: 'Server Room', color: '#92400e', x: 10, y: 310, width: 330, height: 80, desks: [
    { x: 40, y: 30 }, { x: 120, y: 30 }, { x: 200, y: 30 },
  ]},
];

const TASKS_POOL = [
  'Review pull request #142',
  'Deploy staging build',
  'Write unit tests',
  'Fix login bug',
  'Design new landing page',
  'Update documentation',
  'Code review session',
  'Optimize database queries',
  'Setup CI/CD pipeline',
  'Security audit',
  'Client meeting prep',
  'Sprint planning',
  'Bug triage',
  'Performance profiling',
  'Tech debt refactor',
  'API endpoint design',
  'Write integration tests',
  'Refactor auth module',
  'Update dependencies',
  'Deploy to production',
];

const AGENT_CONFIGS: { id: string; name: string; role: AgentRole; color: string; room: RoomId }[] = [
  { id: 'agent-1', name: 'Alice', role: 'CEO', color: '#9333ea', room: 'meeting' },
  { id: 'agent-2', name: 'Bob', role: 'Developer', color: '#2563eb', room: 'dev' },
  { id: 'agent-3', name: 'Carol', role: 'Designer', color: '#db2777', room: 'dev' },
  { id: 'agent-4', name: 'Dave', role: 'QA', color: '#ea580c', room: 'server' },
  { id: 'agent-5', name: 'Eve', role: 'Intern', color: '#6b7280', room: 'lobby' },
];

function getAbsolutePos(room: Room, deskIndex: number, fallbackIndex: number): { x: number; y: number } {
  const desk = room.desks[deskIndex];
  if (desk) {
    return { x: room.x + desk.x, y: room.y + desk.y };
  }
  // If room has no desks (lobby), place in center
  return { x: room.x + 20 + fallbackIndex * 30, y: room.y + room.height / 2 };
}

function makeInitialState(): OfficeState {
  return {
    agents: AGENT_CONFIGS.map((cfg, i) => {
      const room = ROOMS.find(r => r.id === cfg.room)!;
      const pos = getAbsolutePos(room, i % Math.max(room.desks.length, 1), i);
      return {
        ...cfg,
        currentRoom: cfg.room,
        avatar: cfg.name[0],
        status: 'idle',
        task: null,
        x: pos.x,
        y: pos.y,
        speed: 1.5 + Math.random() * 1.5,
      };
    }),
    tasks: [],
    logs: [],
    timestamp: Date.now(),
  };
}

let state: OfficeState = makeInitialState();
let taskIdCounter = 1;
let logIdCounter = 1;
let intervalId: ReturnType<typeof setInterval> | null = null;

function generateId(prefix: string, counter: number): string {
  return `${prefix}-${String(counter).padStart(3, '0')}`;
}

function addLog(message: string, type: LogEntry['type'] = 'info', agentId?: string) {
  state.logs.unshift({
    id: generateId('log', logIdCounter++),
    timestamp: Date.now(),
    message,
    type,
    agentId,
  });
  if (state.logs.length > 50) state.logs.pop();
}

function createTask(): Task {
  const title = TASKS_POOL[Math.floor(Math.random() * TASKS_POOL.length)];
  return {
    id: generateId('task', taskIdCounter++),
    title,
    status: 'pending',
    assignedAgent: '',
    progress: 0,
    duration: 10 + Math.floor(Math.random() * 25),
    startedAt: null,
  };
}

function assignTask(agent: Agent) {
  if (agent.task) return;
  const pending = state.tasks.filter(t => t.status === 'pending');
  if (pending.length === 0) return;
  const task = pending[Math.floor(Math.random() * pending.length)];
  task.status = 'in_progress';
  task.assignedAgent = agent.id;
  task.startedAt = Date.now();
  agent.task = task;
  agent.status = 'working';
  addLog(`${agent.name} started: ${task.title}`, 'task', agent.id);
}

function completeTask(agent: Agent) {
  if (!agent.task) return;
  const task = agent.task;
  task.status = 'done';
  task.progress = 100;
  addLog(`${agent.name} completed: ${task.title}`, 'task', agent.id);
  agent.task = null;
  agent.status = 'idle';
}

// Agents move to a target position; when they arrive, update their room
interface AgentTarget {
  targetX: number;
  targetY: number;
  targetRoom: RoomId;
}
const agentTargets = new Map<string, AgentTarget>();

function startMove(agent: Agent) {
  const rooms = ROOMS.filter(r => r.id !== agent.currentRoom && r.desks.length > 0);
  const targetRoom = rooms[Math.floor(Math.random() * rooms.length)];
  const targetDesk = targetRoom.desks[Math.floor(Math.random() * targetRoom.desks.length)];
  agentTargets.set(agent.id, {
    targetX: targetRoom.x + targetDesk.x,
    targetY: targetRoom.y + targetDesk.y,
    targetRoom: targetRoom.id,
  });
  addLog(`${agent.name} heading to ${targetRoom.name}`, 'move', agent.id);
}

function stepAgent(agent: Agent) {
  const target = agentTargets.get(agent.id);
  if (!target) return;

  const dx = target.targetX - agent.x;
  const dy = target.targetY - agent.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 3) {
    agent.x = target.targetX;
    agent.y = target.targetY;
    agent.currentRoom = target.targetRoom;
    agentTargets.delete(agent.id);

    const room = ROOMS.find(r => r.id === agent.currentRoom)!;
    if (room.id === 'meeting') {
      agent.status = 'meeting';
      addLog(`${agent.name} joined meeting`, 'move', agent.id);
    } else if (room.id === 'break') {
      agent.status = 'break';
      addLog(`${agent.name} taking a break`, 'move', agent.id);
    } else {
      if (agent.status !== 'working') agent.status = 'idle';
      if (agent.status === 'idle' && Math.random() < 0.5) {
        assignTask(agent);
      }
    }
  } else {
    agent.x += (dx / dist) * agent.speed;
    agent.y += (dy / dist) * agent.speed;
  }
}

function tick() {
  state.timestamp = Date.now();

  // Keep enough pending tasks
  while (state.tasks.filter(t => t.status !== 'done').length < 8) {
    state.tasks.push(createTask());
  }

  for (const agent of state.agents) {
    const isMoving = agentTargets.has(agent.id);

    if (isMoving) {
      stepAgent(agent);
      continue;
    }

    if (agent.status === 'working' && agent.task) {
      agent.task.progress += (100 / agent.task.duration);
      if (agent.task.progress >= 100) {
        completeTask(agent);
        if (Math.random() < 0.6) {
          assignTask(agent);
        } else if (Math.random() < 0.3) {
          startMove(agent);
        }
      }
    } else if (agent.status === 'meeting' || agent.status === 'break') {
      // Chance to leave meeting/break
      if (Math.random() < 0.03) {
        agent.status = 'idle';
        startMove(agent);
      }
    } else if (agent.status === 'idle') {
      if (Math.random() < 0.15) {
        assignTask(agent);
      } else if (Math.random() < 0.04) {
        startMove(agent);
      }
    }
  }

  // Trim old done tasks
  if (state.tasks.length > 40) {
    const done = state.tasks.filter(t => t.status === 'done');
    const active = state.tasks.filter(t => t.status !== 'done');
    state.tasks = [...active, ...done.slice(-10)];
  }
}

export function startSimulation() {
  if (intervalId) return;
  addLog('Office simulation started', 'info');
  for (let i = 0; i < 8; i++) {
    state.tasks.push(createTask());
  }
  intervalId = setInterval(tick, 500);
}

export function stopSimulation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    addLog('Office simulation stopped', 'info');
  }
}

export function getState(): OfficeState {
  return state;
}

export function getRooms(): Room[] {
  return ROOMS;
}

export function resetSimulation() {
  state = makeInitialState();
  agentTargets.clear();
  taskIdCounter = 1;
  logIdCounter = 1;
  addLog('Office simulation reset', 'alert');
}
