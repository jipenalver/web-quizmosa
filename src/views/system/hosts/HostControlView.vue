<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import KindChip from '@/components/common/KindChip.vue'
import QueryState from '@/components/common/QueryState.vue'
import StatusChip from '@/components/common/StatusChip.vue'
import JoinPanel from './partials/JoinPanel.vue'
import ParticipantsPanel from './partials/ParticipantsPanel.vue'
import QuestionPanel from './partials/QuestionPanel.vue'
import { useHostControlView } from './useHostControlView'

const {
  sessionQuery,
  participantsQuery,
  finishSession,
  kickParticipant,
  session,
  isPretest,
  questions,
  activeParticipants,
  currentIndex,
  currentQuestion,
  nextQuestion,
  answeredCount,
  countdownSeconds,
  countdownPercent,
  isBusy,
  kicking,
  isKickOpen,
  isFinishOpen,
  notice,
  isNoticeOpen,
  onStartNext,
  onOpenPretest,
  onReveal,
  onReturnToLobby,
  onConfirmFinish,
  onAskKick,
  onConfirmKick,
} = useHostControlView()

const { isPending, error, refetch } = sessionQuery

const isLive = computed(() => session.value?.status !== 'finished')
const isInQuestion = computed(
  () => session.value?.status === 'question' || session.value?.status === 'reveal',
)

// Matches the server, which only hands out questions that have a correct answer.
const pretestTotal = computed(() => questions.value.filter((q) => q.question_keys).length)
</script>

<template>
  <v-container>
    <RouterLink :to="{ name: 'Hosts' }" class="text-body-medium text-muted">
      Back to hosts
    </RouterLink>

    <QueryState
      :empty="false"
      :error="error"
      :loading="isPending"
      empty-title=""
      @retry="refetch()"
    >
      <template v-if="session">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mt-2 mb-6">
          <div>
            <h1 class="text-headline-medium font-weight-bold">
              {{ session.questionnaires?.name }}
            </h1>
            <div class="d-flex align-center ga-2 mt-1">
              <KindChip v-if="session.questionnaires" :kind="session.questionnaires.kind" />
              <StatusChip :status="session.status" />
            </div>
          </div>

          <v-btn
            v-if="!isLive"
            :to="{ name: 'HostDetail', params: { id: session.id } }"
            color="primary"
            prepend-icon="mdi-chart-box-outline"
          >
            Results
          </v-btn>

          <div v-if="isLive" class="d-flex flex-wrap ga-2">
            <v-btn
              :to="{ name: 'LiveHost', params: { id: session.id } }"
              prepend-icon="mdi-podium"
              variant="text"
            >
              Leaderboard
            </v-btn>
            <v-btn
              v-if="isInQuestion && !isPretest"
              :disabled="isBusy"
              prepend-icon="mdi-keyboard-return"
              variant="text"
              @click="onReturnToLobby"
            >
              Lobby
            </v-btn>
            <v-btn
              :disabled="isBusy"
              prepend-icon="mdi-flag-checkered"
              variant="tonal"
              @click="isFinishOpen = true"
            >
              Finish
            </v-btn>
            <!-- A pre-test only has Start; quizzers move through it themselves. -->
            <template v-if="isPretest">
              <v-btn
                v-if="session.status === 'lobby'"
                :loading="isBusy"
                color="primary"
                prepend-icon="mdi-play"
                @click="onOpenPretest"
              >
                Start
              </v-btn>
            </template>
            <v-btn
              v-else-if="session.status === 'question'"
              :loading="isBusy"
              color="primary"
              prepend-icon="mdi-eye-outline"
              @click="onReveal"
            >
              Reveal
            </v-btn>
            <v-btn
              v-else-if="nextQuestion"
              :loading="isBusy"
              color="primary"
              prepend-icon="mdi-play"
              @click="onStartNext"
            >
              {{ session.status === 'lobby' ? 'Start' : 'Next question' }}
            </v-btn>
          </div>
        </div>

        <v-row>
          <v-col cols="12" md="8">
            <div class="d-flex flex-column ga-4">
              <JoinPanel v-if="session.status === 'lobby'" :code="session.join_code" />

              <QuestionPanel
                v-if="isInQuestion && currentQuestion"
                :answered="answeredCount(currentQuestion.id)"
                :countdown-percent="countdownPercent"
                :countdown-seconds="countdownSeconds"
                :index="currentIndex"
                :participants="activeParticipants.length"
                :question="currentQuestion"
                :status="session.status"
                :total="questions.length"
              />

              <v-card v-if="isPretest && session.status === 'question'" class="pa-6">
                <span class="text-label">Pre-test open</span>
                <p class="text-body-large mt-2">
                  Quizzers go at their own pace. Progress shows next to each name. Finish when
                  everyone is done.
                </p>
              </v-card>

              <v-card v-if="session.status === 'finished'" class="pa-6">
                <span class="text-label">Finished</span>
                <p class="text-body-large mt-2">This host has ended.</p>
              </v-card>

              <v-card class="pa-6">
                <span class="text-label">Answers per question</span>
                <v-table class="mt-2" density="compact">
                  <tbody>
                    <tr v-for="(question, index) in questions" :key="question.id">
                      <td>{{ index + 1 }}. {{ question.prompt }}</td>
                      <td class="text-right text-no-wrap">
                        {{ answeredCount(question.id) }} / {{ activeParticipants.length }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </div>
          </v-col>

          <v-col cols="12" md="4">
            <ParticipantsPanel
              :can-kick="isLive"
              :error="participantsQuery.error.value"
              :loading="participantsQuery.isPending.value"
              :participants="participantsQuery.data.value ?? []"
              :progress-total="isPretest ? pretestTotal : undefined"
              @kick="onAskKick"
              @retry="participantsQuery.refetch()"
            />
          </v-col>
        </v-row>
      </template>
    </QueryState>

    <ConfirmDialog
      v-model="isKickOpen"
      :loading="kickParticipant.isPending.value"
      :text="`Remove ${kicking?.display_name} from this host? They cannot rejoin.`"
      confirm-text="Kick"
      title="Kick participant"
      @confirm="onConfirmKick"
    />

    <ConfirmDialog
      v-model="isFinishOpen"
      :loading="finishSession.isPending.value"
      confirm-text="Finish"
      text="End this host for everyone? This cannot be undone."
      title="Finish host"
      @confirm="onConfirmFinish"
    />

    <v-snackbar v-model="isNoticeOpen" color="error">{{ notice }}</v-snackbar>
  </v-container>
</template>
