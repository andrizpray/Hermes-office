<script setup lang="ts">
import Office3D from '@/components/office/Office3D.vue'
import AgentPanel from '@/components/dashboard/AgentPanel.vue'
</script>

<template>
  <div class="flex w-full h-screen bg-bg-primary overflow-hidden">
    <!-- 3D Office View -->
    <div class="flex-1 relative">
      <Office3D />
    </div>

    <!-- Dashboard Sidebar -->
    <AgentPanel />
  </div>
</template>
