<script setup lang="ts">
const props = defineProps<{
  status: 'pending' | 'approved' | 'rejected'
}>()

const colorMap: Record<string, string> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
}
</script>

<template>
  <UBadge :color="colorMap[props.status]" :label="props.status" variant="subtle" size="sm" />
</template>
