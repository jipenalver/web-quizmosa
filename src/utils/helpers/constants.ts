export const formActionDefault = {
  formProcess: false,
  formStatus: 200,
  formMessage: '',
  formAlert: false,
}

export const kindLabels = {
  pretest: 'Pre-test',
  posttest: 'Post-test',
} as const

export const kindColors = {
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

// Validated for colorblind separation and contrast against each mode's surface.
export const kindChartColors = {
  light: { pretest: '#2F6DB5', posttest: '#1F8A70' },
  dark: { pretest: '#5D8CDB', posttest: '#27A07A' },
} as const
