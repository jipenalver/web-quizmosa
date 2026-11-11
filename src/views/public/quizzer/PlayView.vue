<script setup lang="ts">
import { RouterLink } from 'vue-router'
import CountdownRing from '@/components/common/CountdownRing.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import QuestionImage from '@/components/common/QuestionImage.vue'
import PlayChoices from './partials/PlayChoices.vue'
import PlayFinal from './partials/PlayFinal.vue'
import PlayLobbyGuide from './partials/PlayLobbyGuide.vue'
import PlayReveal from './partials/PlayReveal.vue'
import { usePlayView } from './usePlayView'

const {
  code,
  sessionQuery,
  participant,
  questionQuery,
  revealQuery,
  leaderboardQuery,
  submitAnswer,
  nextQuestion,
  progress,
  isSelfPaced,
  screen,
  myAnswer,
  myResult,
  seconds,
  percent,
  notice,
  isNoticeOpen,
  onAnswer,
  onNext,
} = usePlayView()

const { data: question } = questionQuery
</script>

<template>
  <v-container class="d-flex flex-column ga-4 pb-8" style="max-width: 520px">
    <div v-if="screen === 'loading'" class="d-flex justify-center pa-12">
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
    </div>

    <v-alert
      v-else-if="screen === 'error'"
      text="Check your connection and try again."
      title="Could not load this quiz"
      type="error"
      variant="tonal"
    >
      <template #append>
        <v-btn size="small" variant="text" @click="sessionQuery.refetch()">Retry</v-btn>
      </template>
    </v-alert>

    <EmptyState
      v-else-if="screen === 'kicked'"
      text="The host removed you from this quiz."
      title="You were removed"
    />

    <EmptyState
      v-else-if="screen === 'missing'"
      text="You have not joined this quiz, or you can no longer access it."
      title="Quiz not available"
    >
      <RouterLink :to="{ name: 'Join', params: { code } }" class="text-primary">
        Go to join
      </RouterLink>
    </EmptyState>

    <template v-else-if="screen === 'lobby'">
      <EmptyState
        :title="`You're in, ${participant?.display_name ?? 'friend'}!`"
        text="Waiting for the host to start."
      />
      <PlayLobbyGuide :self-paced="isSelfPaced" />
    </template>

    <EmptyState
      v-else-if="screen === 'ready'"
      text="Go at your own pace. Each question has its own timer."
      title="The pre-test is open"
    >
      <v-btn :loading="nextQuestion.isPending.value" color="primary" size="large" @click="onNext">
        Start
      </v-btn>
    </EmptyState>

    <EmptyState
      v-else-if="screen === 'done'"
      text="Your answers are in. Your rank shows when the host finishes."
      title="All done!"
    />

    <PlayFinal
      v-else-if="screen === 'finished'"
      :loading="leaderboardQuery.isPending.value"
      :players="leaderboardQuery.data.value?.length ?? 0"
      :result="myResult"
    />

    <template v-else-if="question">
      <span v-if="isSelfPaced && progress" class="text-label">
        Question {{ progress.served }} of {{ progress.total }}
      </span>

      <div class="d-flex align-center justify-space-between ga-4">
        <h1 class="text-title-large font-weight-bold" style="min-width: 0">
          {{ question.prompt }}
        </h1>
        <CountdownRing
          v-if="screen !== 'reveal'"
          :percent="percent"
          :seconds="seconds"
          :size="72"
          class="flex-shrink-0"
        />
      </div>

      <QuestionImage v-if="question.image_path" :path="question.image_path" height="200" />

      <PlayReveal
        v-if="screen === 'reveal'"
        :loading="revealQuery.isPending.value"
        :my-answer="myAnswer"
        :question="question"
        :reveal="revealQuery.data.value ?? null"
      />

      <template v-else>
        <PlayChoices
          :disabled="screen !== 'question' || submitAnswer.isPending.value"
          :question="question"
          :selected="myAnswer"
          @answer="onAnswer"
        />

        <p v-if="screen === 'locked'" class="text-title-medium font-weight-bold text-center">
          Answer locked
        </p>
        <p v-if="screen === 'timeup'" class="text-title-medium font-weight-bold text-center">
          Time's up
        </p>

        <v-btn
          v-if="isSelfPaced && (screen === 'locked' || screen === 'timeup')"
          :loading="nextQuestion.isPending.value"
          block
          color="primary"
          size="large"
          @click="onNext"
        >
          {{ progress && progress.served < progress.total ? 'Next question' : 'Finish' }}
        </v-btn>
      </template>
    </template>

    <div v-else class="d-flex justify-center pa-12">
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
    </div>

    <v-snackbar v-model="isNoticeOpen">{{ notice }}</v-snackbar>
  </v-container>
</template>
