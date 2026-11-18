<script setup lang="ts">
withDefaults(
  defineProps<{
    isBackground?: boolean
  }>(),
  { isBackground: false },
)
</script>

<template>
  <v-footer
    app
    class="flex-column ga-1 text-center"
    :color="isBackground ? 'background' : 'surface'"
  >
    <span class="text-label">Live quizzes. Spill the answers.</span>

    <span class="text-body-small text-muted">
      created by:
      <a class="text-primary" href="https://jipenalver.github.io/" rel="noopener" target="_blank">
        Jabez Ian Chris D. Penalver
      </a>
    </span>
  </v-footer>
</template>
