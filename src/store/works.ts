import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import {
  Work,
  WorkStatus,
  PublishFormData,
  WorkPage,
  WorkFileType,
  ReviewStage,
  WorkPublishSnapshot,
  WorkStats,
  DailyTrendPoint,
  ReviewEventType,
  ReviewTimelineEvent
} from '@/types'
import { mockWorks } from '@/data/works'
import { generateId } from '@/utils'

interface UploadedFileInfoForSnapshot {
  name: string
  type: WorkFileType
  size: number
  tempFilePath: string
  fingerprint: string
}

const generateMockTrend = (): DailyTrendPoint[] => {
  const result: DailyTrendPoint[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const seed = d.getDate()
    result.push({
      date: d.toISOString().slice(0, 10),
      views: 20 + seed * 15 + ((seed * 7) % 30),
      purchases: 3 + (seed % 8),
      favorites: 5 + ((seed * 3) % 12),
      previewClicks: 10 + seed * 4
    })
  }
  return result
}

const emptyStats = (): WorkStats => ({
  viewCount: 0,
  favoriteCount: 0,
  purchaseCount: 0,
  previewClickCount: 0,
  trend: generateMockTrend()
})

const parseCP = (cpStr: string) => {
  if (!cpStr) return []
  return [{ name: cpStr }]
}

const makeEvent = (
  type: ReviewEventType,
  note?: string,
  time = new Date().toISOString()
): ReviewTimelineEvent => ({
  id: generateId(),
  type,
  time,
  note
})

const buildMockReviewTimeline = (
  status: WorkStatus,
  createdAt: string,
  rejectReason?: string
): ReviewTimelineEvent[] => {
  const created = new Date(createdAt)
  const events: ReviewTimelineEvent[] = []
  events.push(makeEvent('created', undefined, created.toISOString()))

  if (status === 'draft') return events

  const submitted = new Date(created.getTime() + 1000 * 60 * 30)
  events.push(makeEvent('submitted', undefined, submitted.toISOString()))

  if (status === 'reviewing') {
    const reviewing = new Date(submitted.getTime() + 1000 * 60 * 60 * 2)
    events.push(makeEvent('reviewing', undefined, reviewing.toISOString()))
    return events
  }

  if (status === 'rejected') {
    const reviewing = new Date(submitted.getTime() + 1000 * 60 * 60 * 2)
    events.push(makeEvent('reviewing', undefined, reviewing.toISOString()))
    const rejected = new Date(reviewing.getTime() + 1000 * 60 * 60 * 5)
    events.push(
      makeEvent(
        'rejected',
        rejectReason || '稿件存在内容问题，请修改后重新提交',
        rejected.toISOString()
      )
    )
    return events
  }

  if (status === 'published' || status === 'offline') {
    const reviewing = new Date(submitted.getTime() + 1000 * 60 * 60 * 2)
    events.push(makeEvent('reviewing', undefined, reviewing.toISOString()))
    const passed = new Date(reviewing.getTime() + 1000 * 60 * 60 * 4)
    events.push(makeEvent('passed', undefined, passed.toISOString()))
    return events
  }

  return events
}

const enrichMockWorks = (works: Work[]): Work[] =>
  works.map((w, idx) => {
    const reviewStage: ReviewStage | undefined =
      w.status === 'published'
        ? 'passed'
        : w.status === 'reviewing'
        ? idx % 2 === 0
          ? 'reviewing'
          : 'submitted'
        : w.status === 'rejected'
        ? 'need-fix'
        : undefined
    return {
      ...w,
      stats: {
        viewCount: 120 + idx * 80,
        favoriteCount: 15 + idx * 6,
        purchaseCount: 8 + idx * 4,
        previewClickCount: 45 + idx * 20,
        trend: generateMockTrend()
      },
      reviewStage,
      reviewTimeline: buildMockReviewTimeline(
        w.status,
        w.createdAt,
        w.rejectReason
      )
    }
  })

interface WorksState {
  works: Work[]
  addWork: (data: {
    formData: PublishFormData
    coverUrl: string
    previewPages: WorkPage[]
    fileType: WorkFileType
    uploadedFile?: UploadedFileInfoForSnapshot | null
    isPagesChecked?: boolean
    replaceWorkId?: string
    previousTimeline?: ReviewTimelineEvent[]
  }) => string
  saveDraft: (data: {
    formData: PublishFormData
    coverUrl: string
    previewPages: WorkPage[]
    fileType?: WorkFileType
    uploadedFile?: UploadedFileInfoForSnapshot | null
    isPagesChecked?: boolean
    existingWorkId?: string
  }) => string
  getWork: (id: string) => Work | undefined
  updateWork: (id: string, patch: Partial<Work>) => void
  removeWork: (id: string) => void
  rejectWork: (id: string, reason: string) => void
  passWork: (id: string) => void
  setReviewStage: (id: string, stage: ReviewStage, reason?: string) => void
  addReviewEvent: (
    id: string,
    type: ReviewEventType,
    note?: string
  ) => void
}

export const useWorksStore = create<WorksState>()(
  persist(
    (set, get) => ({
      works: enrichMockWorks(mockWorks),

      addWork: (data) => {
        const id = generateId()
        const now = new Date().toISOString()
        const actualPrice = data.formData.price === -1 ? 0 : data.formData.price

        const baseTimeline: ReviewTimelineEvent[] = data.previousTimeline
          ? [...data.previousTimeline]
          : [makeEvent('created', undefined, now)]
        const isResubmit = !!data.replaceWorkId
        baseTimeline.push(
          makeEvent(
            isResubmit ? 'resubmitted' : 'submitted',
            isResubmit ? '作者修改后重新提交' : undefined,
            now
          )
        )

        const work: Work = {
          id,
          title: data.formData.title,
          originalWork: data.formData.originalWork,
          tags: data.formData.tags,
          cp: parseCP(data.formData.cp),
          rating: data.formData.rating,
          pages: data.formData.pages,
          price: actualPrice,
          coverUrl: data.coverUrl,
          fileType: data.fileType,
          status: 'reviewing',
          previewPages: data.previewPages,
          createdAt: data.previousTimeline?.length
            ? (data.previousTimeline[0]?.time || now)
            : now,
          submittedAt: now,
          purchaseCount: 0,
          favoriteCount: 0,
          reviewStage: 'submitted',
          reviewUpdatedAt: now,
          rejectReason: undefined,
          publishSnapshot: {
            formData: data.formData,
            uploadedFile: data.uploadedFile || null,
            previewPages: data.previewPages,
            isPagesChecked: !!data.isPagesChecked
          },
          stats: emptyStats(),
          reviewTimeline: baseTimeline
        }

        set((state) => {
          let nextWorks = state.works
          if (data.replaceWorkId) {
            nextWorks = nextWorks.filter((w) => w.id !== data.replaceWorkId)
          }
          return { works: [work, ...nextWorks] }
        })
        console.log(
          '[WorksStore] Added new work (reviewing):',
          work.id,
          work.title,
          isResubmit ? `(replaced ${data.replaceWorkId})` : ''
        )
        return id
      },

      saveDraft: (data) => {
        const isUpdate = !!data.existingWorkId
        const id = data.existingWorkId || generateId()
        const now = new Date().toISOString()
        const actualPrice = data.formData.price === -1 ? 0 : data.formData.price

        if (isUpdate) {
          set((state) => ({
            works: state.works.map((w) =>
              w.id === id
                ? {
                    ...w,
                    title: data.formData.title || w.title,
                    originalWork: data.formData.originalWork || w.originalWork,
                    tags: data.formData.tags,
                    cp: parseCP(data.formData.cp),
                    rating: data.formData.rating,
                    pages: data.formData.pages || w.pages,
                    price: actualPrice,
                    coverUrl: data.coverUrl || w.coverUrl,
                    fileType: data.fileType || w.fileType,
                    previewPages:
                      data.previewPages.length > 0
                        ? data.previewPages
                        : w.previewPages,
                    status: 'draft',
                    rejectReason: undefined,
                    reviewStage: undefined,
                    publishSnapshot: {
                      formData: data.formData,
                      uploadedFile: data.uploadedFile || null,
                      previewPages: data.previewPages,
                      isPagesChecked: !!data.isPagesChecked
                    }
                  }
                : w
            )
          }))
          console.log('[WorksStore] Updated draft:', id)
        } else {
          const draft: Work = {
            id,
            title: data.formData.title || '未命名草稿',
            originalWork: data.formData.originalWork || '',
            tags: data.formData.tags,
            cp: parseCP(data.formData.cp),
            rating: data.formData.rating,
            pages: data.formData.pages || 0,
            price: actualPrice,
            coverUrl:
              data.coverUrl ||
              (data.previewPages[0]?.url as string) ||
              '',
            fileType: data.fileType || ('pdf' as WorkFileType),
            status: 'draft',
            previewPages: data.previewPages,
            createdAt: now,
            purchaseCount: 0,
            favoriteCount: 0,
            publishSnapshot: {
              formData: data.formData,
              uploadedFile: data.uploadedFile || null,
              previewPages: data.previewPages,
              isPagesChecked: !!data.isPagesChecked
            },
            stats: emptyStats(),
            reviewTimeline: [makeEvent('created', undefined, now)]
          }
          set((state) => ({
            works: [draft, ...state.works]
          }))
          console.log('[WorksStore] Saved new draft:', id)
        }
        return id
      },

      getWork: (id) => {
        return get().works.find((w) => w.id === id)
      },

      updateWork: (id, patch) => {
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id ? { ...w, ...patch } : w
          )
        }))
      },

      removeWork: (id) => {
        set((state) => ({
          works: state.works.filter((w) => w.id !== id)
        }))
      },

      rejectWork: (id, reason) => {
        const now = new Date().toISOString()
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'rejected',
                  rejectReason: reason,
                  reviewStage: 'need-fix',
                  reviewUpdatedAt: now,
                  reviewTimeline: [
                    ...w.reviewTimeline,
                    makeEvent('rejected', reason, now)
                  ]
                }
              : w
          )
        }))
        console.log('[WorksStore] Rejected work:', id, 'reason:', reason)
      },

      passWork: (id) => {
        const now = new Date().toISOString()
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'published',
                  reviewStage: 'passed',
                  reviewUpdatedAt: now,
                  publishedAt: now,
                  reviewTimeline: [
                    ...w.reviewTimeline,
                    makeEvent('passed', undefined, now)
                  ]
                }
              : w
          )
        }))
        console.log('[WorksStore] Passed work:', id)
      },

      setReviewStage: (id, stage, reason) => {
        const now = new Date().toISOString()
        set((state) => ({
          works: state.works.map((w) => {
            if (w.id !== id) return w
            const extraEvents: ReviewTimelineEvent[] = []
            if (stage === 'reviewing') extraEvents.push(makeEvent('reviewing', undefined, now))
            if (stage === 'need-fix' && reason)
              extraEvents.push(makeEvent('rejected', reason, now))
            if (stage === 'passed') extraEvents.push(makeEvent('passed', undefined, now))
            return {
              ...w,
              reviewStage: stage,
              reviewUpdatedAt: now,
              reviewTimeline: [...w.reviewTimeline, ...extraEvents],
              ...(stage === 'need-fix' && reason
                ? { rejectReason: reason, status: 'rejected' }
                : {}),
              ...(stage === 'passed'
                ? { status: 'published', publishedAt: now }
                : {})
            }
          })
        }))
      },

      addReviewEvent: (id, type, note) => {
        const now = new Date().toISOString()
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id
              ? {
                  ...w,
                  reviewTimeline: [...w.reviewTimeline, makeEvent(type, note, now)]
                }
              : w
          )
        }))
      }
    }),
    {
      name: 'doujinshi-works-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return Taro.getStorageSync(name)
          } catch (e) {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            Taro.setStorageSync(name, value)
          } catch (e) {}
        },
        removeItem: (name) => {
          try {
            Taro.removeStorageSync(name)
          } catch (e) {}
        }
      }))
    }
  )
)

export default useWorksStore
