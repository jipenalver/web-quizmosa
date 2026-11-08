import type { ChoiceKey } from '@/types/common'
import type { PlayQuestion } from '@/types/play'
import { choiceKeys } from './constants'

type ChoiceColumns = Pick<PlayQuestion, 'choice_a' | 'choice_b' | 'choice_c' | 'choice_d'>

export function questionChoices(question: ChoiceColumns) {
  const text: Record<ChoiceKey, string | null> = {
    A: question.choice_a,
    B: question.choice_b,
    C: question.choice_c,
    D: question.choice_d,
  }

  return choiceKeys.flatMap((key) => {
    const value = text[key]
    return value ? [{ key, text: value }] : []
  })
}
