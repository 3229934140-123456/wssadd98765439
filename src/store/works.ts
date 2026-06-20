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
  DailyTrendPoint
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

const enrichMockWorks = (works: Work[]): Work[] =>
  works.map((w, idx) => ({
    ...w,
    stats: {
      viewCount: 120 + idx * 80,
      favoriteCount: 15 + idx * 6,
      purchaseCount: 8 + idx * 4,
      previewClickCount: 45 + idx * 20,
      trend: generateMockTrend()
    },
    reviewStage:
      w.status === 'published'
        ? 'passed'
        : w.status === 'reviewing'
        ? idx % 2 === 0
          ? 'reviewing'
          : 'submitted'
        : undefined
  }))

interface WorksState {
  works: Work[]
  addWork: (data: {
    formData: PublishFormData
    coverUrl: string
    previewPages: WorkPage[]
    fileType: WorkFileType
    uploadedFile?: UploadedFileInfoForSnapshot | null
    isPagesChecked?: boolean
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
}

export const useWorksStore = create<WorksState>()(
  persist(
    (set, get) => ({
      works: enrichMockWorks(mockWorks),

      addWork: (data) => {
        const id = generateId()
        const actualPrice = data.formData.price === -1 ? 0 : data.formData.price
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
          createdAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          purchaseCount: 0,
          favoriteCount: 0,
          reviewStage: 'submitted',
          reviewUpdatedAt: new Date().toISOString(),
          publishSnapshot: {
            formData: data.formData,
            uploadedFile: data.uploadedFile || null,
            previewPages: data.previewPages,
            isPagesChecked: !!data.isPagesChecked
          },
          stats: emptyStats()
        }
        set((state) => ({
          works: [work, ...state.works]
        }))
        console.log('[WorksStore] Added new work (reviewing):', work.id, work.title)
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
                      data.previewPages.length > 0 ? data.previewPages : w.previewPages,
                    status: 'draft',
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
            stats: emptyStats()
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
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'rejected',
                  rejectReason: reason,
                  reviewStage: 'need-fix',
                  reviewUpdatedAt: new Date().toISOString()
                }
              : w
          )
        }))
        console.log('[WorksStore] Rejected work:', id, 'reason:', reason)
      },

      passWork: (id) => {
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'published',
                  reviewStage: 'passed',
                  reviewUpdatedAt: new Date().toISOString(),
                  publishedAt: new Date().toISOString()
                }
              : w
          )
        }))
        console.log('[WorksStore] Passed work:', id)
      },

      setReviewStage: (id, stage, reason) => {
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id
              ? {
                  ...w,
                  reviewStage: stage,
                  reviewUpdatedAt: new Date().toISOString(),
                  ...(stage === 'need-fix' && reason
                    ? { rejectReason: reason, status: 'rejected' }
                    : {}),
                  ...(stage === 'passed'
                    ? { status: 'published', publishedAt: new Date().toISOString() }
                    : {})
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
