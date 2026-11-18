export const formActionDefault = {
  formProcess: false,
  formStatus: 200,
  formMessage: '',
  formAlert: false,
}

export const kindLabels = {
  standard: 'Standard',
  pretest: 'Pre-test',
  posttest: 'Post-test',
} as const

export const kindColors = {
  standard: 'primary',
  pretest: 'info',
  posttest: 'success',
} as const

export const kindOptions = (Object.keys(kindLabels) as (keyof typeof kindLabels)[]).map(
  (value) => ({
    title: kindLabels[value],
    value,
  }),
)

export const choiceKeys = ['A', 'B', 'C', 'D'] as const

export const secondsMin = 5
export const secondsMax = 600
export const pointsDefault = 1000
export const imageMaxBytes = 5 * 1024 * 1024
export const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export const statusLabels = {
  lobby: 'Lobby',
  question: 'Live',
  reveal: 'Reveal',
  finished: 'Finished',
} as const

export const statusColors = {
  lobby: 'info',
  question: 'primary',
  reveal: 'warning',
  finished: undefined,
} as const

// The first three were validated for colorblind separation and contrast against each mode's
// surface; the last three were not. Colors repeat past six questionnaires.
export const questionnaireChartColors = {
  light: ['#E0441D', '#2F6DB5', '#1F8A70', '#8A4FB0', '#B07A1F', '#5B5C66'],
  dark: ['#E0441D', '#5D8CDB', '#27A07A', '#B07FD6', '#D9A441', '#B9BAC2'],
} as const
