<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOfficeSocket } from '@/composables/useOfficeSocket'
import { useSound } from '@/composables/useSound'
import type { Agent } from '@/types'

const { agents, eventTimeline, sendChat } = useOfficeSocket()
const { playTaskComplete, playStatusChange, playMessage } = useSound()

const selectedAgentId = ref<string | null>(null)
const chatInput = ref('')
const chatMessages = ref<Array<{ from: string; text: string; time: string }>>([])
const activeTab = ref<'agents' | 'timeline'>('agents')

const selectedAgent = computed(() => {
  if (!selectedAgentId.value) return null
  return agents.value.find((a: Agent) => a.id === selectedAgentId.value) ?? null
})

const workingCount = computed(() => agents.value.filter((a: Agent) => a.status === 'working').length)
const idleCount = computed(() => agents.value.filter((a: Agent) => a.status === 'idle').length)
const offlineCount = computed(() => agents.value.filter((a: Agent) => a.status === 'offline').length)

const selectAgent = (id: string) => {
  selectedAgentId.value = id
}

const getAgentName = (agentId: string): string => {
  const agent = agents.value.find((a: Agent) => a.id === agentId)
  return agent?.name ?? agentId
}

const getEventIcon = (type: string): string => {
  switch (type) {
    case 'status_change': return '🔄'
    case 'task_complete': return '✅'
    case 'task_start': return '🚀'
    case 'message': return '💬'
    default: return '📌'
  }
}

const getEventLabel = (type: string): string => {
  switch (type) {
    case 'status_change': return 'Status Changed'
    case 'task_complete': return 'Task Complete'
    case 'task_start': return 'Started Task'
    case 'message': return 'Message'
    default: return type
  }
}

const getEventColor = (type: string): string => {
  switch (type) {
    case 'status_change': return 'text-accent'
    case 'task_complete': return 'text-success'
    case 'task_start': return 'text-warning'
    case 'message': return 'text-blue-400'
    default: return 'text-text-secondary'
  }
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return date.toLocaleTimeString()
}

// Play sound on new events
watch(() => eventTimeline.value.length, () => {
  const latest = eventTimeline.value[0]
  if (!latest) return
  if (latest.type === 'task_complete') playTaskComplete()
  else if (latest.type === 'status_change') playStatusChange()
  else if (latest.type === 'message') playMessage()
})

const sendMessage = () => {
  if (!chatInput.value.trim() || !selectedAgentId.value) return
  const text = chatInput.value.trim()
  chatMessages.value.push({
    from: 'user',
    text,
    time: new Date().toLocaleTimeString()
  })
  sendChat(selectedAgentId.value, text)
  setTimeout(() => {
    chatMessages.value.push({
      from: 'agent',
      text: 'Got it! I\'ll work on that. 📋',
      time: new Date().toLocaleTimeString()
    })
  }, 1000 + Math.random() * 1000)
  chatInput.value = ''
}
</script>

<template>
  <div class="w-80 h-full bg-bg-secondary border-l border-border flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-border">
      <h2 class="text-lg font-bold text-text-primary flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
        Hermes Office
      </h2>
      <p class="text-xs text-text-secondary mt-1">Monitor your AI agents</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-2 p-3 border-b border-border">
      <div class="text-center p-2 rounded-lg bg-bg-card">
        <div class="text-lg font-bold text-success">{{ workingCount }}</div>
        <div class="text-[10px] text-text-secondary uppercase tracking-wider">Working</div>
      </div>
      <div class="text-center p-2 rounded-lg bg-bg-card">
        <div class="text-lg font-bold text-accent">{{ idleCount }}</div>
        <div class="text-[10px] text-text-secondary uppercase tracking-wider">Idle</div>
      </div>
      <div class="text-center p-2 rounded-lg bg-bg-card">
        <div class="text-lg font-bold text-gray-400">{{ offlineCount }}</div>
        <div class="text-[10px] text-text-secondary uppercase tracking-wider">Offline</div>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div class="flex border-b border-border">
      <button
        class="flex-1 py-2 text-xs font-medium transition-colors"
        :class="activeTab === 'agents' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'"
        @click="activeTab = 'agents'"
      >
        Agents
      </button>
      <button
        class="flex-1 py-2 text-xs font-medium transition-colors relative"
        :class="activeTab === 'timeline' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'"
        @click="activeTab = 'timeline'"
      >
        Timeline
        <span v-if="eventTimeline.length > 0"
          class="absolute top-1 right-3 w-4 h-4 rounded-full bg-accent text-white text-[9px] flex items-center justify-center">
          {{ eventTimeline.length > 9 ? '9+' : eventTimeline.length }}
        </span>
      </button>
    </div>

    <!-- Agents Tab -->
    <div v-if="activeTab === 'agents'" class="flex-1 overflow-y-auto p-2">
      <div class="text-xs text-text-secondary uppercase tracking-wider px-2 py-1 mb-1">Agents</div>
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-1"
        :class="selectedAgentId === agent.id ? 'bg-accent/20 border border-accent/30' : 'hover:bg-bg-card border border-transparent'"
        @click="selectAgent(agent.id)"
      >
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          :style="{
            backgroundColor: agent.status === 'working' ? '#22c55e20' : agent.status === 'idle' ? '#6366f120' : '#6b728020',
            color: agent.status === 'working' ? '#22c55e' : agent.status === 'idle' ? '#6366f1' : '#6b7280'
          }">
          {{ agent.name.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-text-primary truncate">{{ agent.name }}</div>
          <div class="text-xs text-text-secondary truncate">{{ agent.role }}</div>
          <div v-if="agent.currentTask" class="text-[10px] text-success truncate mt-0.5">
            {{ agent.currentTask }}
          </div>
        </div>
        <div class="w-2 h-2 rounded-full shrink-0"
          :class="{
            'bg-success': agent.status === 'working',
            'bg-accent': agent.status === 'idle',
            'bg-gray-500': agent.status === 'offline'
          }"></div>
      </div>

      <div v-if="agents.length === 0" class="text-center py-8 text-text-secondary text-sm">
        No agents connected
      </div>
    </div>

    <!-- Timeline Tab -->
    <div v-if="activeTab === 'timeline'" class="flex-1 overflow-y-auto p-2">
      <div v-if="eventTimeline.length === 0" class="text-center py-8 text-text-secondary text-sm">
        No events yet. Agents will appear here as they work.
      </div>
      <div class="relative">
        <!-- Timeline line -->
        <div v-if="eventTimeline.length > 0" class="absolute left-4 top-0 bottom-0 w-px bg-border"></div>

        <!-- Event items -->
        <div
          v-for="(event, i) in eventTimeline"
          :key="i"
          class="relative flex items-start gap-3 p-2 mb-1 group"
        >
          <!-- Icon dot -->
          <div class="relative z-10 w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-xs shrink-0 group-hover:border-accent transition-colors">
            {{ getEventIcon(event.type) }}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pt-0.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-medium" :class="getEventColor(event.type)">
                {{ getEventLabel(event.type) }}
              </span>
              <span class="text-xs text-text-secondary">
                {{ getAgentName(event.agentId) }}
              </span>
            </div>
            <div v-if="event.data?.task" class="text-xs text-text-secondary mt-0.5 truncate">
              📋 {{ event.data.task }}
            </div>
            <div class="text-[10px] text-text-secondary mt-0.5 opacity-60">
              {{ formatTime(event.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Panel (overlay when agent selected) -->
    <div v-if="selectedAgent" class="border-t border-border flex flex-col" style="height: 280px;">
      <div class="p-3 border-b border-border flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            :style="{
              backgroundColor: selectedAgent.status === 'working' ? '#22c55e20' : '#6366f120',
              color: selectedAgent.status === 'working' ? '#22c55e' : '#6366f1'
            }">
            {{ selectedAgent.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <div class="text-sm font-medium text-text-primary">{{ selectedAgent.name }}</div>
            <div class="text-[10px] text-text-secondary">{{ selectedAgent.role }}</div>
          </div>
        </div>
        <button @click="selectedAgentId = null" class="text-text-secondary hover:text-text-primary text-xs">✕</button>
      </div>

      <!-- Agent Detail -->
      <div class="px-3 py-2 border-b border-border bg-bg-card/50">
        <div class="flex items-center gap-2 mb-1.5">
          <span
            class="px-2 py-0.5 rounded-full text-[10px] font-medium"
            :class="{
              'bg-success/20 text-success': selectedAgent.status === 'working',
              'bg-accent/20 text-accent': selectedAgent.status === 'idle',
              'bg-gray-500/20 text-gray-400': selectedAgent.status === 'offline'
            }"
          >
            {{ selectedAgent.status }}
          </span>
          <span v-if="selectedAgent.currentTask" class="text-xs text-text-secondary truncate flex-1">
            {{ selectedAgent.currentTask }}
          </span>
        </div>
        <div class="text-[10px] text-text-secondary">
          Last active: {{ selectedAgent.lastActivity ? new Date(selectedAgent.lastActivity).toLocaleTimeString() : 'N/A' }}
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        <div v-for="(msg, i) in chatMessages" :key="i"
          class="text-xs"
          :class="msg.from === 'user' ? 'text-right' : 'text-left'">
          <span class="inline-block px-2.5 py-1.5 rounded-lg"
            :class="msg.from === 'user' ? 'bg-accent/20 text-accent' : 'bg-bg-card text-text-primary'">
            {{ msg.text }}
          </span>
        </div>
        <div v-if="chatMessages.length === 0" class="text-center text-text-secondary text-xs py-4">
          Start a conversation
        </div>
      </div>

      <!-- Chat Input -->
      <div class="p-2 border-t border-border">
        <div class="flex gap-2">
          <input
            v-model="chatInput"
            @keyup.enter="sendMessage"
            type="text"
            placeholder="Type a message..."
            class="flex-1 bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
          />
          <button
            @click="sendMessage"
            class="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/80 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
