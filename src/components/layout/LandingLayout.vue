<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import FooterNavigation from '@/components/navigation/FooterNavigation.vue'

const route = useRoute()
</script>

<template>
  <v-app-bar color="background" flat>
    <RouterLink :to="{ name: 'Home' }" class="logo-link d-flex ml-4" aria-label="Home">
      <AppLogo height="28" />
    </RouterLink>

    <v-spacer></v-spacer>

    <ThemeToggle class="mr-2" />
  </v-app-bar>

  <v-main>
    <RouterView />
  </v-main>

  <FooterNavigation v-if="!route.meta.hideFooter" :is-background="true" />
</template>
