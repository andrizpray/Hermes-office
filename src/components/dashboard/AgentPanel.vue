<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOfficeSocket } from '@/composables/useOfficeSocket'
import type { Agent } from '@/types'

const { agents, lastEvent, sendChat } = useOfficeSocket()

const selectedAgentId = ref<string | null>(null)
const chatInput = ref('')
const chatMessages = ref<Array<{ from: string; text: string; time: string }>>([])

const selectedAgent = computed(() => {
  if (!selectedAgentId.value) return null
  return agents.value.find(a => a.id === selectedAgentId.value) ?? null
})

const workingCount = computed(() => agents.value.filter((a: Agent) => a.status === 'working').length)
const idleCount = computed(() => agents.value.filter((a: Agent) => a.status === 'idle').length)
const offlineCount = computed(() => agents.value.filter((a: Agent) => a.status === 'offline').length)

const selectAgent = (id: string) => {
  selectedAgentId.value = id
}

const sendMessage = () => {
  if (!chatInput.value.trim() || !selectedAgentId.value) return
  const text = chatInput.value.trim()
  chatMessages.value.push({
    from: 'user',
    text,
    time: new Date().toLocaleTimeString()
  })
  // Send via socket
  sendChat(selectedAgentId.value, text)
  // Simulate agent response
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

    <!-- Agent List -->
    <div class="flex-1 overflow-y-auto p-2">
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

    <!-- Chat Panel -->
    <div v-if="selectedAgent" class="border-t border-border flex flex-col" style="height: 280px;">
      <div class="p-3 border-b border-border flex items-center justify-between">
        <div class="text-sm font-medium text-text-primary">Chat with {{ selectedAgent.name }}</div>
        <button @click="selectedAgentId = null" class="text-text-secondary hover:text-text-primary text-xs">✕</button>
      </div>
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
            class="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/80 transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>

    <!-- Last Event -->
    <div v-if="lastEvent" class="p-2 border-t border-border">
      <div class="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Last Event</div>
      <div class="text-xs text-text-primary bg-bg-card rounded-lg p-2">
        <span class="text-accent font-medium">{{ lastEvent.type }}</span>
        <span class="text-text-secondary"> — {{ lastEvent.agentId }}</span>
      </div>
    </div>
  </div>
</template>
