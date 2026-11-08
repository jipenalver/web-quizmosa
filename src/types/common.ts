import type { Database } from './database'
import type { choiceKeys } from '@/utils/helpers/constants'

export type QuestionnaireKind = Database['public']['Enums']['questionnaire_kind']
export type SessionStatus = Database['public']['Enums']['session_status']
export type ChoiceKey = (typeof choiceKeys)[number]
