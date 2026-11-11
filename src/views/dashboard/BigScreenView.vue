<script setup lang="ts">
import { computed } from 'vue'
import AppLogo from '@/components/common/AppLogo.vue'
import CountdownRing from '@/components/common/CountdownRing.vue'
import QrCode from '@/components/common/QrCode.vue'
import QuestionImage from '@/components/common/QuestionImage.vue'
import { questionChoices } from '@/utils/helpers/questions'
import BigScreenDistribution from './partials/BigScreenDistribution.vue'
import BigScreenPodium from './partials/BigScreenPodium.vue'
import LeaderboardList from './partials/LeaderboardList.vue'
import { useBigScreenView } from './useBigScreenView'

const {
  sessionQuery,
  leaderboardQuery,
  countsQuery,
  session,
  questions,
  currentIndex,
  currentQuestion,
  isPretest,
  answeredCount,
  participantCount,
  doneCount,
  seconds,
  percent,
  isFullscreen,
  onToggleFullscreen,
} = useBigScreenView()

const { error, refetch } = sessionQuery

const leaderboard = computed(() => leaderboardQuery.data.value ?? [])
const joinUrl = computed(() => `${window.location.origin}/join/${session.value?.join_code}`)
const choices = computed(() =>
  currentQuestion.value ? questionChoices(currentQuestion.value) : [],
)
</script>

<template>
  <v-theme-provider theme="dark" with-background>
    <div class="big-screen d-flex flex-column pa-8 ga-6">
      <div class="d-flex align-center justify-space-between">
        <AppLogo height="40" />
        <v-btn
          :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          variant="text"
          @click="onToggleFullscreen"
        ></v-btn>
      </div>

      <v-alert v-if="error" text="Could not load this host." type="error" variant="tonal">
        <template #append>
          <v-btn variant="text" @click="refetch()">Retry</v-btn>
        </template>
      </v-alert>

      <template v-else-if="session">
        <div
          v-if="session.status === 'lobby'"
          class="d-flex flex-grow-1 align-center justify-center flex-wrap ga-16"
        >
          <div>
            <span class="text-label">Join at {{ joinUrl.replace(/\/join\/.*/, '') }}/join</span>
            <div class="big-code font-weight-bold">{{ session.join_code }}</div>
            <p class="big-text mt-4">{{ participantCount }} joined</p>
          </div>
          <QrCode :size="360" :value="joinUrl" />
        </div>

        <!-- A self-paced pre-test has no shared question, so the room sees live points. -->
        <div v-else-if="session.status === 'question' && isPretest" class="flex-grow-1">
          <span class="text-label">Pre-test in progress</span>
          <h1 class="big-prompt font-weight-bold mt-2">Answer on your phone</h1>
          <p class="big-text mt-4">{{ doneCount }} of {{ participantCount }} done</p>

          <span class="text-label d-block mt-12">Leaderboard</span>
          <LeaderboardList :limit="8" :rows="leaderboard" class="mt-4" large />
        </div>

        <div v-else-if="session.status === 'question' && currentQuestion" class="flex-grow-1">
          <div class="d-flex align-start justify-space-between ga-8">
            <div style="min-width: 0">
              <span class="text-label"
                >Question {{ currentIndex + 1 }} of {{ questions.length }}</span
              >
              <h1 class="big-prompt font-weight-bold mt-2">{{ currentQuestion.prompt }}</h1>
            </div>
            <CountdownRing
              :percent="percent"
              :seconds="seconds"
              :size="180"
              :width="14"
              class="flex-shrink-0"
            />
          </div>

          <QuestionImage
            v-if="currentQuestion.image_path"
            :path="currentQuestion.image_path"
            class="mt-6"
            height="320"
          />

          <div class="big-choices mt-8">
            <div
              v-for="choice in choices"
              :key="choice.key"
              class="big-text pa-6 bg-surface rounded-xl"
            >
              <span class="font-weight-bold text-primary mr-4">{{ choice.key }}</span>
              {{ choice.text }}
            </div>
          </div>

          <p class="big-text mt-8">{{ answeredCount }} of {{ participantCount }} answered</p>
        </div>

        <div
          v-else-if="session.status === 'reveal' && currentQuestion"
          class="big-reveal flex-grow-1"
        >
          <div style="min-width: 0">
            <span class="text-label"
              >Question {{ currentIndex + 1 }} of {{ questions.length }}</span
            >
            <h1 class="big-prompt font-weight-bold mt-2 mb-8">{{ currentQuestion.prompt }}</h1>

            <!-- A pre-test never shows the key or the counts, so it cannot spoil the post-test. -->
            <p v-if="isPretest" class="big-text">Answers are in.</p>
            <BigScreenDistribution
              v-else
              :choices="choices"
              :correct="currentQuestion.question_keys?.correct_choice ?? null"
              :counts="countsQuery.data.value ?? {}"
            />
          </div>

          <div>
            <span class="text-label">Leaderboard</span>
            <LeaderboardList :limit="6" :rows="leaderboard" class="mt-4" large />
          </div>
        </div>

        <BigScreenPodium
          v-else-if="session.status === 'finished'"
          :rows="leaderboard"
          class="flex-grow-1"
        />
      </template>
    </div>
  </v-theme-provider>
</template>

<style scoped>
.big-screen {
  min-height: 100vh;
}

.big-code {
  font-family: var(--v-font-heading);
  font-size: clamp(5rem, 13vw, 12rem);
  letter-spacing: 0.06em;
  line-height: 1.1;
}

.big-prompt {
  font-family: var(--v-font-heading);
  font-size: clamp(2rem, 4.5vw, 4.5rem);
  line-height: 1.15;
}

.big-text {
  font-size: clamp(1.5rem, 2.6vw, 2.75rem);
}

.big-choices {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
}

.big-reveal {
  display: grid;
  gap: 48px;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
}
</style>
