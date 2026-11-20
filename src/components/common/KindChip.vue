<script setup lang="ts">
import type { SessionKind } from '@/types/common'
import { kindColors, kindLabels } from '@/utils/helpers/constants'

// Pre-tests are always self-paced, so only a self-paced post-test says so.
defineProps<{ kind: SessionKind; selfPaced?: boolean }>()
</script>

<template>
  <v-chip :color="kindColors[kind]" size="small" variant="tonal">
    {{ kindLabels[kind] }}{{ kind === 'posttest' && selfPaced ? ' · Self-paced' : '' }}
  </v-chip>
</template>
