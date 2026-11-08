import type { ChoiceKey } from '@/types/common'
import type { ImportPreviewRow } from '@/types/questionnaires'
import { choiceKeys, secondsMax, secondsMin } from './constants'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

function parseRow(raw: unknown, rowNumber: number): ImportPreviewRow {
  const row = isObject(raw) ? raw : {}
  const rawChoices = isObject(row.choices) ? row.choices : {}
  const errors: string[] = []

  if (!isObject(raw)) errors.push('Row must be an object')

  const prompt = text(row.prompt)
  if (!prompt) errors.push('Prompt is required')

  const choices: Partial<Record<ChoiceKey, string>> = {}
  for (const key of choiceKeys) {
    const choice = text(rawChoices[key])
    if (choice) choices[key] = choice
  }
  if (!choices.A || !choices.B) errors.push('Choices A and B are required')

  const answer = text(row.answer).toUpperCase()
  const isValidAnswer = (choiceKeys as readonly string[]).includes(answer)
  if (!isValidAnswer) {
    errors.push('Answer must be A, B, C or D')
  } else if (!choices[answer as ChoiceKey]) {
    errors.push(`Answer ${answer} points to an empty choice`)
  }

  const points = row.points ?? null
  if (points !== null && (!Number.isInteger(points) || (points as number) < 0)) {
    errors.push('Points must be a whole number of 0 or more')
  }

  const seconds = row.seconds ?? null
  if (
    seconds !== null &&
    (!Number.isInteger(seconds) ||
      (seconds as number) < secondsMin ||
      (seconds as number) > secondsMax)
  ) {
    errors.push(`Seconds must be a whole number from ${secondsMin} to ${secondsMax}`)
  }

  return {
    rowNumber,
    prompt,
    answer,
    points: typeof points === 'number' ? points : null,
    seconds: typeof seconds === 'number' ? seconds : null,
    errors,
    value:
      errors.length > 0
        ? null
        : {
            prompt,
            choices,
            answer: answer as ChoiceKey,
            ...(points !== null && { points: points as number }),
            ...(seconds !== null && { seconds: seconds as number }),
          },
  }
}

// Returns a whole-file error, or one preview row per question with its own errors.
export function parseQuestionImport(source: string): {
  fileError: string | null
  rows: ImportPreviewRow[]
} {
  let parsed: unknown

  try {
    parsed = JSON.parse(source)
  } catch {
    return { fileError: 'This is not valid JSON.', rows: [] }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { fileError: 'The file must be a non-empty JSON array of questions.', rows: [] }
  }

  return { fileError: null, rows: parsed.map((row, index) => parseRow(row, index + 1)) }
}
