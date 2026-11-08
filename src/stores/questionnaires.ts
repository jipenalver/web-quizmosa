import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { queryClient } from '@/utils/queryClient'
import { supabase } from '@/utils/supabase'
import type { QuestionImportRow, QuestionInput, QuestionnaireInput, QuestionnaireWithCounts, QuestionWithKey } from '@/types/questionnaires'

const imageBucket = 'questions'
const signedUrlSeconds = 3600

const questionnaireSelect = '*, questions(count), sessions(count)'

export const questionnaireKeys = {
  all: ['questionnaires'] as const,
  detail: (id: number) => ['questionnaires', id] as const,
  questions: (id: number) => ['questionnaires', id, 'questions'] as const,
}

// Generated RPC types mark nullable arguments as required, so null needs a cast.
const nullable = <T>(value: T | null) => value as T

async function getHostId() {
  return queryClient.fetchQuery({
    queryKey: ['host-id'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_host_id')
      if (error) throw error
      return data
    },
  })
}

// Questionnaires
export function useQuestionnairesQuery() {
  return useQuery({
    queryKey: questionnaireKeys.all,
    queryFn: async (): Promise<QuestionnaireWithCounts[]> => {
      const { data, error } = await supabase
        .from('questionnaires')
        .select(questionnaireSelect)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useQuestionnaireQuery(id: number) {
  return useQuery({
    queryKey: questionnaireKeys.detail(id),
    queryFn: async (): Promise<QuestionnaireWithCounts> => {
      const { data, error } = await supabase
        .from('questionnaires')
        .select(questionnaireSelect)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useSaveQuestionnaire() {
  return useMutation({
    mutationFn: async ({ id, ...values }: QuestionnaireInput) => {
      if (id !== null) {
        const { error } = await supabase.from('questionnaires').update(values).eq('id', id)
        if (error) throw error
        return id
      }

      const host_id = await getHostId()
      const { data, error } = await supabase
        .from('questionnaires')
        .insert({ ...values, host_id })
        .select('id')
        .single()
      if (error) throw error
      return data.id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionnaireKeys.all }),
  })
}

export function useDeleteQuestionnaire() {
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: questions, error: readError } = await supabase
        .from('questions')
        .select('image_path')
        .eq('questionnaire_id', id)
        .not('image_path', 'is', null)
      if (readError) throw readError

      const { error } = await supabase.from('questionnaires').delete().eq('id', id)
      if (error) {
        if (error.code === '23503') {
          throw new Error('This questionnaire has hosts, so it cannot be deleted.')
        }
        throw error
      }

      await removeQuestionImages(questions.flatMap((q) => q.image_path ?? []))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionnaireKeys.all }),
  })
}

// Questions
export function useQuestionsQuery(questionnaireId: number) {
  return useQuery({
    queryKey: questionnaireKeys.questions(questionnaireId),
    queryFn: async (): Promise<QuestionWithKey[]> => {
      const { data, error } = await supabase
        .from('questions')
        .select('*, question_keys(correct_choice)')
        .eq('questionnaire_id', questionnaireId)
        .order('position')
      if (error) throw error
      return data
    },
  })
}

export function useSaveQuestion() {
  return useMutation({
    mutationFn: async (input: QuestionInput) => {
      const uploadedPath = input.imageFile
        ? await uploadQuestionImage(input.questionnaireId, input.imageFile)
        : null
      const imagePath = uploadedPath ?? input.imagePath

      const { error } = await supabase.rpc('save_question', {
        p_questionnaire_id: input.questionnaireId,
        p_question_id: nullable(input.id),
        p_prompt: input.prompt,
        p_image_path: nullable(imagePath),
        p_choice_a: input.choices.A,
        p_choice_b: input.choices.B,
        p_choice_c: input.choices.C,
        p_choice_d: input.choices.D,
        p_correct: input.correct,
        p_points: input.points,
        p_seconds_override: nullable(input.secondsOverride),
      })

      if (error) {
        if (uploadedPath) await removeQuestionImages([uploadedPath])
        throw error
      }

      if (input.previousImagePath && input.previousImagePath !== imagePath) {
        await removeQuestionImages([input.previousImagePath])
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionnaireKeys.all }),
  })
}

export function useDeleteQuestion() {
  return useMutation({
    mutationFn: async ({ id, image_path }: Pick<QuestionWithKey, 'id' | 'image_path'>) => {
      const { error } = await supabase.from('questions').delete().eq('id', id)
      if (error) throw error
      if (image_path) await removeQuestionImages([image_path])
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionnaireKeys.all }),
  })
}

export function useReorderQuestions(questionnaireId: number) {
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const { error } = await supabase.rpc('reorder_questions', {
        p_questionnaire_id: questionnaireId,
        p_ids: ids,
      })
      if (error) throw error
    },
    // Also runs after a failure, so the list snaps back to the saved order.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.questions(questionnaireId) }),
  })
}

export function useImportQuestions(questionnaireId: number) {
  return useMutation({
    mutationFn: async (rows: QuestionImportRow[]) => {
      const { data, error } = await supabase.rpc('import_questions', {
        p_questionnaire_id: questionnaireId,
        p_rows: rows,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionnaireKeys.all }),
  })
}

// Question images (private bucket, so reads go through signed URLs)
export function useQuestionImageUrl(path: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => ['question-image', toValue(path)]),
    enabled: computed(() => Boolean(toValue(path))),
    staleTime: (signedUrlSeconds - 600) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(imageBucket)
        .createSignedUrl(toValue(path) ?? '', signedUrlSeconds)
      if (error) throw error
      return data.signedUrl
    },
  })
}

async function uploadQuestionImage(questionnaireId: number, file: File) {
  const hostId = await getHostId()
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'img'
  const path = `${hostId}/${questionnaireId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from(imageBucket).upload(path, file)
  if (error) throw error

  return path
}

// Best effort: a leftover file is harmless, so this never fails the action around it.
async function removeQuestionImages(paths: string[]) {
  if (paths.length > 0) await supabase.storage.from(imageBucket).remove(paths)
}
