<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TresCanvas, useLoop } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import * as THREE from 'three'
import { useOfficeSocket } from '@/composables/useOfficeSocket'
import type { Agent } from '@/types'

const { agents } = useOfficeSocket()

const selectedAgentId = ref<string | null>(null)
const hoveredAgentId = ref<string | null>(null)

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
const WHITE_COLOR = '#ffffff'
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

      <!-- Agent Avatars -->
      <template v-for="(agent, index) in agents" :key="agent.id">
        <TresGroup :position="getAgentPosition(agent, index)">
          <!-- Shadow -->
          <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -1.15, 0]">
            <TresCircleGeometry :args="[0.4, 16]" />
            <TresMeshBasicMaterial :color="SHADOW_COLOR" :transparent="true" :opacity="0.2" />
          </TresMesh>

          <!-- Body -->
          <TresMesh
            :scale="getAgentScale(agent)"
            :cast-shadow="true"
            @click="() => selectAgent(agent.id)"
            @pointer-enter="() => hoveredAgentId = agent.id"
            @pointer-leave="() => hoveredAgentId = null"
          >
            <TresCapsuleGeometry :args="[0.3, 0.8, 8, 16]" />
            <TresMeshStandardMaterial
              :color="getAgentColor(agent.status)"
              :emissive="getAgentColor(agent.status)"
              :emissive-intensity="hoveredAgentId === agent.id ? 0.5 : 0.2"
              :roughness="0.4"
              :metalness="0.6"
            />
          </TresMesh>

          <!-- Head -->
          <TresMesh :scale="getAgentScale(agent)" :cast-shadow="true">
            <TresSphereGeometry :args="[0.25, 16, 16]" />
            <TresMeshStandardMaterial
              :color="getAgentColor(agent.status)"
              :emissive="getAgentColor(agent.status)"
              :emissive-intensity="0.15"
              :roughness="0.3"
              :metalness="0.5"
            />
          </TresMesh>

          <!-- Eyes -->
          <TresMesh :position="[0.08, 2.02, 0.2]">
            <TresSphereGeometry :args="[0.04, 8, 8]" />
            <TresMeshBasicMaterial :color="WHITE_COLOR" />
          </TresMesh>
          <TresMesh :position="[-0.08, 2.02, 0.2]">
            <TresSphereGeometry :args="[0.04, 8, 8]" />
            <TresMeshBasicMaterial :color="WHITE_COLOR" />
          </TresMesh>

          <!-- Working ring -->
          <TresMesh
            v-if="(animStates.get(agent.id)?.ringScale ?? 0) > 0.01"
            :position="[0, -0.15, 0]"
            :rotation="[-Math.PI / 2, 0, 0]"
            :scale="[animStates.get(agent.id)?.ringScale ?? 0, animStates.get(agent.id)?.ringScale ?? 0, 1]"
          >
            <TresRingGeometry :args="[0.6, 0.75, 32]" />
            <TresMeshBasicMaterial :color="getAgentColor(agent.status)" :transparent="true" :opacity="0.5" />
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

          <!-- Task indicator -->
          <TresMesh v-if="agent.status === 'working'" :position="[0.4, 2.5, 0]">
            <TresBoxGeometry :args="[0.15, 0.15, 0.15]" />
            <TresMeshBasicMaterial :color="getAgentColor(agent.status)" :transparent="true" :opacity="0.8" />
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

    <!-- Selected Agent Info -->
    <Transition name="slide-up">
      <div
        v-if="selectedAgent"
        class="absolute bottom-4 left-4 z-10 w-72 p-4 rounded-xl bg-bg-card/90 backdrop-blur-md border border-border shadow-lg"
      >
        <div class="flex items-center gap-3 mb-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
            :style="{ backgroundColor: getAgentColor(selectedAgent.status) + '30', color: getAgentColor(selectedAgent.status) }"
          >
            {{ selectedAgent.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="font-semibold text-text-primary">{{ selectedAgent.name }}</h3>
            <p class="text-xs text-text-secondary">{{ selectedAgent.role }}</p>
          </div>
          <div class="ml-auto">
            <span
              class="px-2 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-success/20 text-success': selectedAgent.status === 'working',
                'bg-accent/20 text-accent': selectedAgent.status === 'idle',
                'bg-gray-500/20 text-gray-400': selectedAgent.status === 'offline'
              }"
            >
              {{ selectedAgent.status }}
            </span>
          </div>
        </div>
        <div v-if="selectedAgent.currentTask" class="text-xs text-text-secondary flex items-center gap-2">
          <span class="w-2 h-2 rounded-full animate-pulse" :class="selectedAgent.status === 'working' ? 'bg-success' : 'bg-accent'"></span>
          <span>{{ selectedAgent.currentTask }}</span>
        </div>
        <div v-if="selectedAgent.lastActivity" class="text-xs text-text-secondary mt-1">
          Last active: {{ new Date(selectedAgent.lastActivity).toLocaleTimeString() }}
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
