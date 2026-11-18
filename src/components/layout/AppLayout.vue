<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import SideNavigation from '@/components/navigation/SideNavigation.vue'
import { useAuthUserStore } from '@/stores/authUser'
import FooterNavigation from '../navigation/FooterNavigation.vue'

const router = useRouter()
const authUserStore = useAuthUserStore()

// null lets Vuetify open the drawer on desktop and close it on mobile.
const isDrawerVisible = ref<boolean | null>(null)

const onSignOut = async () => {
  await authUserStore.signOut()
  router.replace({ name: 'Login' })
}
</script>

<template>
  <v-app-bar color="surface" flat border="b">
    <v-app-bar-nav-icon
      aria-label="Toggle navigation"
      @click="isDrawerVisible = !isDrawerVisible"
    ></v-app-bar-nav-icon>

    <RouterLink :to="{ name: 'Dashboard' }" class="logo-link d-flex" aria-label="Dashboard">
      <AppLogo height="26" />
    </RouterLink>

    <v-spacer></v-spacer>

    <ThemeToggle />

    <v-btn
      icon="mdi-logout"
      aria-label="Sign out"
      class="mr-2"
      variant="text"
      @click="onSignOut"
    ></v-btn>
  </v-app-bar>

  <SideNavigation v-model="isDrawerVisible" />

  <v-main>
    <RouterView />
  </v-main>

  <FooterNavigation />
</template>
