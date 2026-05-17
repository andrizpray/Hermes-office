<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TresCanvas, useLoop } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import * as THREE from 'three'
import { useOfficeSocket } from '@/composables/useOfficeSocket'
import { useSound } from '@/composables/useSound'
import type { Agent } from '@/types'

const { agents, eventTimeline } = useOfficeSocket()
const { playHover, playSelect } = useSound()

const selectedAgentId = ref<string | null>(null)
const hoveredAgentId = ref<string | null>(null)

const filteredAgentEvents = computed(() => {
  if (!selectedAgentId.value) return []
  return eventTimeline.value
    .filter(e => e.agentId === selectedAgentId.value)
    .slice(0, 20)
})

const agentStats = computed(() => {
  if (!selectedAgentId.value) return { completed: 0, started: 0 }
  const events = eventTimeline.value.filter(e => e.agentId === selectedAgentId.value)
  return {
    completed: events.filter(e => e.type === 'task_complete').length,
    started: events.filter(e => e.type === 'task_start').length,
  }
})

const closeAgent = () => {
  selectedAgentId.value = null
}

interface AgentAnimState {
  bobOffset: number
  bobSpeed: number
  typingPhase: number
  ringScale: number
}

const animStates = ref<Map<string, AgentAnimState>>(new Map())

watch(agents, (newAgents) => {
  newAgents.forEach(agent => {
    if (!animStates.value.has(agent.id)) {
      animStates.value.set(agent.id, {
        bobOffset: Math.random() * Math.PI * 2,
        bobSpeed: 1 + Math.random() * 0.5,
        typingPhase: Math.random() * Math.PI * 2,
        ringScale: 0
      })
    }
  })
}, { immediate: true })

const WALL_HEIGHT = 4
const FLOOR_COLOR = '#111827'
const WALL_COLOR = '#1a2332'
const DESK_COLOR = '#1e293b'
const MONITOR_COLOR = '#1e293b'
const GRID_COLOR = '#1e293b'
const LIGHT_COLOR_1 = '#6366f1'
const LIGHT_COLOR_2 = '#818cf8'
const ORB_COLOR = '#6366f1'
const SHADOW_COLOR = '#000000'
const DOUBLE_SIDE = THREE.DoubleSide

const deskPositions = [
  { x: -6, z: 2 }, { x: -6, z: 6 }, { x: -6, z: 10 },
  { x: 0, z: 2 }, { x: 0, z: 6 }, { x: 0, z: 10 },
  { x: 6, z: 2 }, { x: 6, z: 6 }, { x: 6, z: 10 },
]

const light1Pos: [number, number, number] = [-8, 10, -8]
const light2Pos: [number, number, number] = [8, 10, -8]
const light3Pos: [number, number, number] = [0, 10, 8]
const dirLightPos: [number, number, number] = [0, 15, 0]
const camPos: [number, number, number] = [0, 20, 20]
const lookAt: [number, number, number] = [0, 0, 0]

const orbPositions = [
  { x: -12, y: 2.5, z: -4 }, { x: -12, y: 3, z: 8 },
  { x: 0, y: 2, z: -4 }, { x: 0, y: 3.5, z: 8 },
  { x: 12, y: 2.5, z: -4 }, { x: 12, y: 3, z: 8 },
  { x: -8, y: 2, z: 4 }, { x: 8, y: 2.5, z: 4 },
]

const getAgentPosition = (agent: Agent, index: number): [number, number, number] => {
  const desk = deskPositions[index % deskPositions.length]
  const state = animStates.value.get(agent.id)
  const bobY = state ? Math.sin(state.bobOffset + performance.now() * 0.001 * state.bobSpeed) * 0.05 : 0
  return [desk.x, bobY, desk.z]
}

const getAgentColor = (status: Agent['status']): string => {
  switch (status) {
    case 'working': return '#22c55e'
    case 'idle': return '#6366f1'
    case 'offline': return '#6b7280'
    default: return '#6366f1'
  }
}

const getRoleAccent = (role: string): string => {
  if (role.toLowerCase().includes('dev')) return '#3b82f6'
  if (role.toLowerCase().includes('design')) return '#ec4899'
  if (role.toLowerCase().includes('data')) return '#f59e0b'
  if (role.toLowerCase().includes('qa')) return '#14b8a6'
  return '#6366f1'
}

const getAgentScale = (agent: Agent): [number, number, number] => {
  const state = animStates.value.get(agent.id)
  if (!state) return [1, 1, 1]
  if (agent.status === 'working') {
    const bounce = 1 + Math.sin(state.typingPhase) * 0.03
    return [bounce, bounce, bounce]
  }
  return [1, 1, 1]
}

const selectAgent = (agentId: string) => {
  selectedAgentId.value = selectedAgentId.value === agentId ? null : agentId
}

const selectedAgent = computed(() => {
  if (!selectedAgentId.value) return null
  return agents.value.find(a => a.id === selectedAgentId.value) ?? null
})

const deskPos = (desk: { x: number; z: number }): [number, number, number] => [desk.x, 0.4, desk.z]

const loop = useLoop()
let time = 0

loop.onBeforeRender(() => {
  time += 0.016
  animStates.value.forEach((state, agentId) => {
    const agent = agents.value.find(a => a.id === agentId)
    if (agent?.status === 'working') {
      state.typingPhase += 0.15
      state.ringScale = Math.min(state.ringScale + 0.05, 1)
    } else {
      state.ringScale = Math.max(state.ringScale - 0.03, 0)
    }
  })
})
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Connection Status -->
    <div class="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card/80 backdrop-blur-sm border border-border">
      <div class="w-2 h-2 rounded-full bg-success animate-pulse"></div>
      <span class="text-xs text-text-secondary">Live</span>
    </div>

    <!-- Agent Count -->
    <div class="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-bg-card/80 backdrop-blur-sm border border-border">
      <span class="text-xs text-text-secondary">{{ agents.length }} agents online</span>
    </div>

    <!-- Room Labels -->
    <div class="absolute top-16 left-4 z-10 text-xs space-y-1">
      <div class="px-2 py-1 rounded bg-accent/20 text-accent border border-accent/30">Main Office</div>
    </div>

    <!-- 3D Canvas -->
    <TresCanvas
      clear-color="#0a0f1a"
      :shadows="true"
      :alpha="false"
      window-size
    >
      <TresPerspectiveCamera :position="camPos" :look-at="lookAt" />
      <OrbitControls
        :enable-damping="true"
        :damping-factor="0.05"
        :max-polar-angle="Math.PI / 2.2"
        :min-distance="8"
        :max-distance="60"
      />

      <!-- Lighting -->
      <TresAmbientLight :intensity="0.3" />
      <TresDirectionalLight :position="dirLightPos" :intensity="0.6" :cast-shadow="true" />
      <TresPointLight :position="light1Pos" :intensity="0.4" :color="LIGHT_COLOR_1" />
      <TresPointLight :position="light2Pos" :intensity="0.4" :color="LIGHT_COLOR_2" />
      <TresPointLight :position="light3Pos" :intensity="0.3" :color="LIGHT_COLOR_1" />

      <!-- Floor -->
      <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, 0, 4]" :receive-shadow="true">
        <TresPlaneGeometry :args="[36, 24]" />
        <TresMeshStandardMaterial :color="FLOOR_COLOR" :roughness="0.8" :metalness="0.2" />
      </TresMesh>

      <!-- Floor Grid -->
      <TresGridHelper :args="[20, 20, GRID_COLOR, GRID_COLOR]" :position="[0, 0.01, 4]" />

      <!-- Back wall -->
      <TresMesh :position="[0, WALL_HEIGHT / 2, 12]" :receive-shadow="true">
        <TresPlaneGeometry :args="[20, WALL_HEIGHT]" />
        <TresMeshStandardMaterial :color="WALL_COLOR" :roughness="0.9" :side="DOUBLE_SIDE" />
      </TresMesh>
      <!-- Left wall -->
      <TresMesh :position="[-10, WALL_HEIGHT / 2, 4]" :rotation="[0, Math.PI / 2, 0]" :receive-shadow="true">
        <TresPlaneGeometry :args="[16, WALL_HEIGHT]" />
        <TresMeshStandardMaterial :color="WALL_COLOR" :roughness="0.9" :side="DOUBLE_SIDE" />
      </TresMesh>
      <!-- Right wall -->
      <TresMesh :position="[10, WALL_HEIGHT / 2, 4]" :rotation="[0, -Math.PI / 2, 0]" :receive-shadow="true">
        <TresPlaneGeometry :args="[16, WALL_HEIGHT]" />
        <TresMeshStandardMaterial :color="WALL_COLOR" :roughness="0.9" :side="DOUBLE_SIDE" />
      </TresMesh>
      <!-- Front wall -->
      <TresMesh :position="[0, WALL_HEIGHT / 2, -4]" :receive-shadow="true">
        <TresPlaneGeometry :args="[20, WALL_HEIGHT]" />
        <TresMeshStandardMaterial :color="WALL_COLOR" :roughness="0.9" :side="DOUBLE_SIDE" />
      </TresMesh>

      <!-- Desks -->
      <TresMesh
        v-for="(desk, i) in deskPositions"
        :key="'desk-' + i"
        :position="deskPos(desk)"
        :cast-shadow="true"
        :receive-shadow="true"
      >
        <TresBoxGeometry :args="[2.4, 0.8, 1.4]" />
        <TresMeshStandardMaterial :color="DESK_COLOR" :roughness="0.6" :metalness="0.3" />
      </TresMesh>

      <!-- Monitors -->
      <TresMesh
        v-for="(desk, i) in deskPositions"
        :key="'monitor-' + i"
        :position="[desk.x, 0.85, desk.z - 0.5]"
        :cast-shadow="true"
      >
        <TresBoxGeometry :args="[1.2, 0.8, 0.05]" />
        <TresMeshStandardMaterial :color="MONITOR_COLOR" :roughness="0.5" :metalness="0.5" />
      </TresMesh>

      <!-- Agent Avatars — Low-poly Humanoid -->
      <template v-for="(agent, index) in agents" :key="agent.id">
        <TresGroup :position="getAgentPosition(agent, index)">
          <!-- Shadow -->
          <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -1.15, 0]">
            <TresCircleGeometry :args="[0.5, 16]" />
            <TresMeshBasicMaterial :color="SHADOW_COLOR" :transparent="true" :opacity="0.25" />
          </TresMesh>

          <!-- Legs -->
          <TresMesh :position="[-0.13, -0.7, 0]" :cast-shadow="true">
            <TresBoxGeometry :args="[0.16, 0.5, 0.16]" />
            <TresMeshStandardMaterial
              :color="getRoleAccent(agent.role)"
              :emissive="getRoleAccent(agent.role)"
              :emissive-intensity="0.1"
              :roughness="0.5"
              :metalness="0.4"
            />
          </TresMesh>
          <TresMesh :position="[0.13, -0.7, 0]" :cast-shadow="true">
            <TresBoxGeometry :args="[0.16, 0.5, 0.16]" />
            <TresMeshStandardMaterial
              :color="getRoleAccent(agent.role)"
              :emissive="getRoleAccent(agent.role)"
              :emissive-intensity="0.1"
              :roughness="0.5"
              :metalness="0.4"
            />
          </TresMesh>

          <!-- Torso -->
          <TresMesh
            :scale="getAgentScale(agent)"
            :cast-shadow="true"
            @click="() => { selectAgent(agent.id); playSelect() }"
            @pointer-enter="() => { hoveredAgentId = agent.id; playHover() }"
            @pointer-leave="() => hoveredAgentId = null"
          >
            <TresBoxGeometry :args="[0.6, 0.7, 0.3]" />
            <TresMeshStandardMaterial
              :color="getRoleAccent(agent.role)"
              :emissive="getAgentColor(agent.status)"
              :emissive-intensity="hoveredAgentId === agent.id ? 0.4 : 0.15"
              :roughness="0.4"
              :metalness="0.5"
            />
          </TresMesh>

          <!-- Chest panel (screen on torso) -->
          <TresMesh :position="[0, 0.05, 0.16]">
            <TresBoxGeometry :args="[0.28, 0.22, 0.02]" />
            <TresMeshStandardMaterial
              :color="getAgentColor(agent.status)"
              :emissive="getAgentColor(agent.status)"
              :emissive-intensity="agent.status === 'working' ? 0.6 : 0.2"
              :roughness="0.2"
              :metalness="0.8"
            />
          </TresMesh>

          <!-- Left arm -->
          <TresMesh :position="[-0.42, 0.05, 0]" :cast-shadow="true">
            <TresBoxGeometry :args="[0.14, 0.55, 0.14]" />
            <TresMeshStandardMaterial
              :color="getRoleAccent(agent.role)"
              :emissive="getRoleAccent(agent.role)"
              :emissive-intensity="0.08"
              :roughness="0.5"
              :metalness="0.4"
            />
          </TresMesh>

          <!-- Right arm -->
          <TresMesh :position="[0.42, 0.05, 0]" :cast-shadow="true">
            <TresBoxGeometry :args="[0.14, 0.55, 0.14]" />
            <TresMeshStandardMaterial
              :color="getRoleAccent(agent.role)"
              :emissive="getRoleAccent(agent.role)"
              :emissive-intensity="0.08"
              :roughness="0.5"
              :metalness="0.4"
            />
          </TresMesh>

          <!-- Neck -->
          <TresMesh :position="[0, 0.46, 0]">
            <TresCylinderGeometry :args="[0.1, 0.1, 0.12, 8]" />
            <TresMeshStandardMaterial
              :color="getRoleAccent(agent.role)"
              :roughness="0.3"
              :metalness="0.6"
            />
          </TresMesh>

          <!-- Head -->
          <TresMesh :position="[0, 0.7, 0]" :scale="getAgentScale(agent)" :cast-shadow="true">
            <TresBoxGeometry :args="[0.42, 0.42, 0.38]" />
            <TresMeshStandardMaterial
              :color="getRoleAccent(agent.role)"
              :emissive="getAgentColor(agent.status)"
              :emissive-intensity="0.2"
              :roughness="0.3"
              :metalness="0.5"
            />
          </TresMesh>

          <!-- Visor (face screen) -->
          <TresMesh :position="[0, 0.7, 0.2]">
            <TresBoxGeometry :args="[0.3, 0.18, 0.02]" />
            <TresMeshStandardMaterial
              :color="getAgentColor(agent.status)"
              :emissive="getAgentColor(agent.status)"
              :emissive-intensity="agent.status === 'working' ? 0.8 : 0.3"
              :roughness="0.1"
              :metalness="0.9"
            />
          </TresMesh>

          <!-- Antenna -->
          <TresMesh :position="[0, 1.02, 0]">
            <TresCylinderGeometry :args="[0.025, 0.02, 0.22, 6]" />
            <TresMeshStandardMaterial
              :color="getAgentColor(agent.status)"
              :emissive="getAgentColor(agent.status)"
              :emissive-intensity="0.5"
              :roughness="0.2"
              :metalness="0.8"
            />
          </TresMesh>
          <TresMesh :position="[0, 1.15, 0]">
            <TresSphereGeometry :args="[0.055, 8, 8]" />
            <TresMeshStandardMaterial
              :color="getAgentColor(agent.status)"
              :emissive="getAgentColor(agent.status)"
              :emissive-intensity="1"
              :roughness="0.1"
              :metalness="0.5"
            />
          </TresMesh>

          <!-- Working glow ring -->
          <TresMesh
            v-if="agent.status === 'working'"
            :position="[0, -0.15, 0]"
            :rotation="[-Math.PI / 2, 0, 0]"
          >
            <TresRingGeometry :args="[0.8, 0.95, 32]" />
            <TresMeshBasicMaterial :color="getAgentColor(agent.status)" :transparent="true" :opacity="0.2" />
          </TresMesh>

          <!-- Working pulse ring -->
          <TresMesh
            v-if="agent.status === 'working'"
            :position="[0, -0.15, 0]"
            :rotation="[-Math.PI / 2, 0, 0]"
            :scale="[animStates.get(agent.id)?.ringScale ?? 0, animStates.get(agent.id)?.ringScale ?? 0, 1]"
          >
            <TresRingGeometry :args="[0.55, 0.7, 32]" />
            <TresMeshBasicMaterial :color="getAgentColor(agent.status)" :transparent="true" :opacity="0.4" />
          </TresMesh>

          <!-- Task indicator above head -->
          <TresMesh v-if="agent.status === 'working'" :position="[0, 1.4, 0]">
            <TresBoxGeometry :args="[0.12, 0.12, 0.12]" />
            <TresMeshBasicMaterial :color="getAgentColor(agent.status)" :transparent="true" :opacity="0.9" />
          </TresMesh>
        </TresGroup>
      </template>

      <!-- Floating orbs -->
      <TresMesh
        v-for="(orb, i) in orbPositions"
        :key="'orb-' + i"
        :position="[orb.x, orb.y + Math.sin(time + i) * 0.3, orb.z]"
      >
        <TresSphereGeometry :args="[0.08, 8, 8]" />
        <TresMeshBasicMaterial :color="ORB_COLOR" :transparent="true" :opacity="0.4" />
      </TresMesh>

      <!-- Corner accent lights -->
      <TresMesh :position="[-18, 0.05, 10]">
        <TresBoxGeometry :args="[0.3, 0.05, 0.3]" />
        <TresMeshBasicMaterial :color="LIGHT_COLOR_1" />
      </TresMesh>
      <TresMesh :position="[18, 0.05, 10]">
        <TresBoxGeometry :args="[0.3, 0.05, 0.3]" />
        <TresMeshBasicMaterial :color="LIGHT_COLOR_1" />
      </TresMesh>
    </TresCanvas>

    <!-- Selected Agent Detail Panel -->
    <Transition name="slide-up">
      <div
        v-if="selectedAgent"
        class="absolute bottom-4 left-4 z-10 w-80 p-4 rounded-xl bg-bg-card/95 backdrop-blur-md border border-border shadow-xl"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 mb-3">
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shadow-md"
            :style="{ backgroundColor: getAgentColor(selectedAgent.status) + '30', color: getAgentColor(selectedAgent.status) }"
          >
            {{ selectedAgent.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-text-primary truncate">{{ selectedAgent.name }}</h3>
            <p class="text-xs text-text-secondary">{{ selectedAgent.role }}</p>
          </div>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
            :class="{
              'bg-success/20 text-success': selectedAgent.status === 'working',
              'bg-accent/20 text-accent': selectedAgent.status === 'idle',
              'bg-gray-500/20 text-gray-400': selectedAgent.status === 'offline'
            }"
          >
            {{ selectedAgent.status }}
          </span>
          <button
            @click="closeAgent"
            class="w-7 h-7 rounded-full bg-bg-hover hover:bg-border transition-colors flex items-center justify-center text-text-secondary hover:text-text-primary ml-1"
          >
            ✕
          </button>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-3 gap-2 mb-3">
          <div class="bg-bg-hover rounded-lg p-2 text-center">
            <div class="text-lg font-bold text-success">{{ agentStats.completed }}</div>
            <div class="text-[10px] text-text-secondary">Completed</div>
          </div>
          <div class="bg-bg-hover rounded-lg p-2 text-center">
            <div class="text-lg font-bold text-accent">{{ agentStats.started }}</div>
            <div class="text-[10px] text-text-secondary">Started</div>
          </div>
          <div class="bg-bg-hover rounded-lg p-2 text-center">
            <div class="text-lg font-bold" :class="selectedAgent.status === 'working' ? 'text-success' : 'text-text-secondary'">
              {{ selectedAgent.status === 'working' ? '🟢' : selectedAgent.status === 'idle' ? '🔵' : '⚫' }}
            </div>
            <div class="text-[10px] text-text-secondary capitalize">{{ selectedAgent.status }}</div>
          </div>
        </div>

        <!-- Current Task -->
        <div v-if="selectedAgent.currentTask" class="mb-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full animate-pulse" :class="selectedAgent.status === 'working' ? 'bg-success' : 'bg-accent'"></span>
            <span class="text-xs text-text-secondary">Current Task</span>
          </div>
          <p class="text-xs text-text-primary bg-bg-hover rounded px-2 py-1.5">{{ selectedAgent.currentTask }}</p>
          <div v-if="selectedAgent.status === 'working'" class="mt-1.5 h-1 bg-bg-hover rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-accent to-success rounded-full animate-pulse" style="width: 65%"></div>
          </div>
        </div>

        <!-- Last active -->
        <div v-if="selectedAgent.lastActivity" class="text-xs text-text-secondary mb-3">
          Last active: {{ new Date(selectedAgent.lastActivity).toLocaleTimeString() }}
        </div>

        <!-- Task History -->
        <div v-if="filteredAgentEvents.length > 0" class="mb-3">
          <div class="text-xs text-text-secondary mb-1.5">Recent Activity</div>
          <div class="max-h-32 overflow-y-auto space-y-1">
            <div
              v-for="event in filteredAgentEvents.slice(0, 6)"
              :key="event.timestamp"
              class="flex items-center gap-2 text-[10px]"
            >
              <span
                class="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                :class="{
                  'bg-success/20 text-success': event.type === 'task_complete',
                  'bg-accent/20 text-accent': event.type === 'task_start',
                  'bg-blue-500/20 text-blue-400': event.type === 'status_change',
                  'bg-purple-500/20 text-purple-400': event.type === 'message'
                }"
              >
                <span v-if="event.type === 'task_complete'">✓</span>
                <span v-else-if="event.type === 'task_start'">▶</span>
                <span v-else-if="event.type === 'status_change'">⟳</span>
                <span v-else>💬</span>
              </span>
              <span class="text-text-secondary flex-1 truncate">{{ event.data?.message || event.type }}</span>
              <span class="text-text-secondary/60 shrink-0">{{ new Date(event.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            class="flex-1 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent text-xs font-medium transition-colors"
          >
            💬 Message
          </button>
          <button
            @click="closeAgent"
            class="px-3 py-1.5 rounded-lg bg-bg-hover hover:bg-border text-text-secondary text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
