<script setup lang="ts">
import { useRules } from 'vuetify'
import AppLogo from '@/components/common/AppLogo.vue'
import { contactEmailPrimary, contactEmailSecondary } from '@/utils/helpers/constants'
import HomeIntro from './partials/HomeIntro.vue'
import { useHomeView } from './useHomeView'

const rules = useRules()

const { isIntroVisible, joinCode, refVForm, onFormSubmit } = useHomeView()

const steps = [
  {
    icon: 'mdi-file-document-edit-outline',
    title: 'Build a questionnaire',
    text: 'Write questions with images and timers, or import them in bulk.',
  },
  {
    icon: 'mdi-cellphone-text',
    title: 'Host it live',
    text: 'Run it as a pre-test or post-test. Participants join from their phones with a code.',
  },
  {
    icon: 'mdi-chart-line',
    title: 'See who learned',
    text: 'Rankings update live, then compare pre-test and post-test results.',
  },
]

const features = [
  { icon: 'mdi-timer-outline', title: 'Server-timed countdowns' },
  { icon: 'mdi-trophy-outline', title: 'Live leaderboard' },
  { icon: 'mdi-projector-screen-outline', title: 'Big-screen view' },
  { icon: 'mdi-run-fast', title: 'Self-paced mode' },
  { icon: 'mdi-compare-horizontal', title: 'Pre and post comparison' },
  { icon: 'mdi-file-pdf-box', title: 'PDF export' },
]

const mailSubject = encodeURIComponent('Quizmosa admin account request')
const mailBody = encodeURIComponent(
  'Hi Jabez,\n\nI would like a Quizmosa admin account.\n\nName:\nOrganization:\nCountry:\nExpected number of participants:\n',
)
const mailto = (email: string) => `mailto:${email}?subject=${mailSubject}&body=${mailBody}`
</script>

<template>
  <HomeIntro v-if="isIntroVisible" @done="isIntroVisible = false" />

  <v-container class="home-hero d-flex flex-column align-center justify-center ga-8">
    <div class="d-flex flex-column align-center ga-4 text-center">
      <AppLogo height="64" style="max-width: 100%" />
      <h1 class="text-headline-medium">Free live quizzes for trainors, anywhere.</h1>
    </div>

    <v-card class="pa-6 w-100" max-width="420">
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-text-field
          v-model="joinCode"
          :rules="[
            rules.required('Enter your join code'),
            rules.pattern(/^[A-Za-z0-9]{6}$/, 'Join codes have 6 letters or numbers'),
          ]"
          autocomplete="off"
          class="mb-2"
          label="Join code"
          maxlength="6"
        ></v-text-field>

        <v-btn block color="primary" size="large" type="submit">Join a quiz</v-btn>
      </v-form>

      <p class="text-body-small text-muted text-center mt-4">
        Got a code from your trainor? Enter it above.
      </p>
    </v-card>

    <v-btn append-icon="mdi-chevron-down" href="#trainors" variant="text">For trainors</v-btn>
  </v-container>

  <v-container id="trainors" class="py-16" style="max-width: 1040px">
    <span class="text-label">How it works</span>
    <v-row class="mt-4">
      <v-col v-for="(step, index) in steps" :key="step.title" cols="12" md="4">
        <v-card class="pa-6 h-100">
          <v-icon :icon="step.icon" color="primary" size="32"></v-icon>
          <h2 class="text-title-large mt-4">{{ index + 1 }}. {{ step.title }}</h2>
          <p class="text-body-medium text-muted mt-2">{{ step.text }}</p>
        </v-card>
      </v-col>
    </v-row>

    <span class="text-label d-block mt-16">What you get</span>
    <v-row class="mt-4">
      <v-col v-for="feature in features" :key="feature.title" cols="6" md="4">
        <v-card class="pa-4 h-100 d-flex align-center ga-3">
          <v-icon :icon="feature.icon" color="primary"></v-icon>
          <span class="text-body-large">{{ feature.title }}</span>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="pa-8 mt-16 text-center">
      <h2 class="text-headline-small">Want to host your own quizzes?</h2>
      <p class="text-body-large text-muted mt-2 mx-auto" style="max-width: 560px">
        Quizmosa is free. Admin accounts are given on request. Send a message with your name and
        organization.
      </p>
      <div class="d-flex flex-wrap justify-center ga-3 mt-6">
        <v-btn :href="mailto(contactEmailPrimary)" color="primary" prepend-icon="mdi-email-outline">
          {{ contactEmailPrimary }}
        </v-btn>
        <v-btn :href="mailto(contactEmailSecondary)" prepend-icon="mdi-email-outline" variant="outlined">
          {{ contactEmailSecondary }}
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<style scoped>
.home-hero {
  min-height: calc(100dvh - 64px);
}

#trainors {
  scroll-margin-top: 64px;
}
</style>
