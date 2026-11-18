import type { RouteRecordRaw } from 'vue-router'

export const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/HistoryView.vue'),
    meta: { title: 'Dashboard' },
  },
  {
    path: '/dashboard/live/:id',
    name: 'LiveHost',
    component: () => import('@/views/dashboard/LiveView.vue'),
    meta: { title: 'Live leaderboard' },
  },
  {
    path: '/dashboard/hosts/:id',
    name: 'HostDetail',
    component: () => import('@/views/dashboard/HostDetailView.vue'),
    meta: { title: 'Host results' },
  },
  {
    path: '/dashboard/questionnaires/:id',
    name: 'QuestionnaireComparison',
    component: () => import('@/views/dashboard/QuestionnaireComparisonView.vue'),
    meta: { title: 'Pre-test vs post-test' },
  },
  {
    path: '/questionnaires',
    name: 'Questionnaires',
    component: () => import('@/views/system/questionnaires/QuestionnairesView.vue'),
    meta: { title: 'Questionnaires' },
  },
  {
    path: '/questionnaires/:id',
    name: 'QuestionnaireDetail',
    component: () => import('@/views/system/questionnaires/QuestionnaireDetailView.vue'),
    meta: { title: 'Questionnaire' },
  },
  {
    path: '/hosts',
    name: 'Hosts',
    component: () => import('@/views/system/hosts/HostsView.vue'),
    meta: { title: 'Hosts' },
  },
  {
    path: '/hosts/:id',
    name: 'HostControl',
    component: () => import('@/views/system/hosts/HostControlView.vue'),
    meta: { title: 'Host control' },
  },
  {
    path: '/participants',
    name: 'Participants',
    component: () => import('@/views/system/participants/ParticipantsView.vue'),
    meta: { title: 'Participants' },
  },
]
