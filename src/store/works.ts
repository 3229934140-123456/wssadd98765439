import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Work, WorkStatus, PublishFormData, WorkPage, WorkFileType } from '@/types'
import { mockWorks } from '@/data/works'
import { generateId } from '@/utils'

interface WorksState {
  works: Work[]
  addWork: (data: {
    formData: PublishFormData
    coverUrl: string
    previewPages: WorkPage[]
    fileType: WorkFileType
  }) => string
  getWork: (id: string) => Work | undefined
  updateWork: (id: string, patch: Partial<Work>) => void
  removeWork: (id: string) => void
}

const parseCP = (cpStr: string) => {
  if (!cpStr) return []
  return [{ name: cpStr }]
}

export const useWorksStore = create<WorksState>()(
  persist(
    (set, get) => ({
      works: [...mockWorks],

      addWork: (data) => {
        const id = generateId()
        const work: Work = {
          id,
          title: data.formData.title,
          originalWork: data.formData.originalWork,
          tags: data.formData.tags,
          cp: parseCP(data.formData.cp),
          rating: data.formData.rating,
          pages: data.formData.pages,
          price: data.formData.price,
          coverUrl: data.coverUrl,
          fileType: data.fileType,
          status: 'reviewing',
          previewPages: data.previewPages,
          createdAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          purchaseCount: 0,
          favoriteCount: 0
        }
        set((state) => ({
          works: [work, ...state.works]
        }))
        console.log('[WorksStore] Added new work:', work.id, work.title)
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
