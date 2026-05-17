import { ref, readonly } from 'vue'
import { io, type Socket } from 'socket.io-client'
import type { Agent, AgentEvent } from '@/types'

// ─────────────────────────────────────────
// Singleton socket instance (shared across all composable calls)
// ─────────────────────────────────────────
const SOCKET_URL = 'http://localhost:8091'

const _agents = ref<Agent[]>([])
const _isConnected = ref(false)
const _lastEvent = ref<AgentEvent | null>(null)
let _socket: Socket | null = null
let _initialized = false

// Demo agents (shown before backend connects)
const _demoAgents: Agent[] = [
  { id: 'demo-1', name: 'DevBot', role: 'Developer', status: 'idle', lastActivity: new Date().toISOString() },
  { id: 'demo-2', name: 'DesignBot', role: 'Designer', status: 'idle', lastActivity: new Date().toISOString() },
  { id: 'demo-3', name: 'DataBot', role: 'Analyst', status: 'idle', lastActivity: new Date().toISOString() },
  { id: 'demo-4', name: 'QABot', role: 'QA Engineer', status: 'idle', lastActivity: new Date().toISOString() },
]

// Initialize with demo agents
_agents.value = [..._demoAgents]

function _connect() {
  if (_socket?.connected) return

  _socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  })

  _socket.on('connect', () => {
    _isConnected.value = true
    console.log('[Office] Connected to backend')
  })

  _socket.on('disconnect', () => {
    _isConnected.value = false
    console.log('[Office] Disconnected from backend')
  })

  _socket.on('connect_error', (err) => {
    console.error('[Office] Connection error:', err.message)
    _isConnected.value = false
  })

  _socket.on('agents:init', (data: Agent[]) => {
    console.log('[Office] Received agents from backend:', data.length)
    _agents.value = data
  })

  _socket.on('agent:update', (agent: Agent) => {
    const idx = _agents.value.findIndex((a: Agent) => a.id === agent.id)
    if (idx >= 0) {
      _agents.value[idx] = { ..._agents.value[idx], ...agent }
    } else {
      _agents.value.push(agent)
    }
  })

  _socket.on('agent:remove', (agentId: string) => {
    _agents.value = _agents.value.filter((a: Agent) => a.id !== agentId)
  })

  _socket.on('agent:event', (event: AgentEvent) => {
    _lastEvent.value = event
    console.log('[Office] Agent event:', event.type, event.agentId)
  })

  _socket.on('response', (data: unknown) => {
    console.log('[Office] Response:', data)
  })
}

function _disconnect() {
  _socket?.disconnect()
  _socket = null
  _isConnected.value = false
}

function _sendChat(agentId: string, message: string) {
  if (!_socket?.connected) return
  _socket.emit('chat_send', { agentId, message })
}

// Initialize once on first use
if (!_initialized) {
  _initialized = true
  _connect()
}

// ─────────────────────────────────────────
// Composable (returns singleton state)
// ─────────────────────────────────────────
export function useOfficeSocket() {
  return {
    agents: readonly(_agents),
    isConnected: readonly(_isConnected),
    lastEvent: readonly(_lastEvent),
    connect: _connect,
    disconnect: _disconnect,
    sendChat: _sendChat
  }
}
