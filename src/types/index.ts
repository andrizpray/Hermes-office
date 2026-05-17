export interface Agent {
  id: string
  name: string
  role: string
  status: 'idle' | 'working' | 'offline'
  avatar?: string
  currentTask?: string
  lastActivity?: string
  position?: { x: number; y: number; z: number }
}

export interface AgentEvent {
  type: 'status_change' | 'new_task' | 'task_complete' | 'agent_join' | 'agent_leave'
  agentId: string
  timestamp: string
  data?: Record<string, unknown>
}

export interface OfficeState {
  agents: Agent[]
  selectedAgentId: string | null
  isConnected: boolean
}
