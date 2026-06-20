import { create } from 'zustand'
import Taro from '@tarojs/taro'
import {
  WorkPage,
  WorkFileType,
  RatingLevel,
  PublishFormData,
  ReviewTimelineEvent
} from '@/types'
import { generateId } from '@/utils'

interface UploadedFileInfo {
  name: string
  type: WorkFileType
  size: number
  tempFilePath: string
  fingerprint: string
}

interface PublishState {
  editingWorkId: string | null
  editingTimeline: ReviewTimelineEvent[]
  formData: PublishFormData
  uploadedFile: UploadedFileInfo | null
  previewPages: WorkPage[]
  coverPreviewUrl: string
  isPagesChecked: boolean
  setFormData: (data: Partial<PublishFormData>) => void
  setUploadedFile: (file: UploadedFileInfo | null) => void
  setPreviewPages: (pages: WorkPage[]) => void
  setPageIssue: (pageIndex: number, issue: 'missing' | 'blurry' | 'wrong-direction', checked: boolean) => void
  setPagesChecked: (checked: boolean) => void
  loadFromWorkSnapshot: (data: {
    workId: string
    formData: PublishFormData
    uploadedFile: UploadedFileInfo | null
    previewPages: WorkPage[]
    isPagesChecked: boolean
    timeline?: ReviewTimelineEvent[]
  }) => void
  resetPublish: () => void
}

const initialFormData: PublishFormData = {
  title: '',
  originalWork: '',
  tags: [],
  cp: '',
  rating: 'G',
  pages: 0,
  price: 0
}

export const usePublishStore = create<PublishState>((set, get) => ({
  editingWorkId: null,
  editingTimeline: [],
  formData: initialFormData,
  uploadedFile: null,
  previewPages: [],
  coverPreviewUrl: '',
  isPagesChecked: false,

  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data }
    })),

  setUploadedFile: (file) =>
    set(() => ({
      uploadedFile: file
    })),

  setPreviewPages: (pages) =>
    set(() => ({
      previewPages: pages,
      coverPreviewUrl: pages.length > 0 ? pages[0].url : ''
    })),

  setPageIssue: (pageIndex, issue, checked) =>
    set((state) => {
      const newPages = state.previewPages.map((p) => {
        if (p.index !== pageIndex) return p
        const currentIssues = p.issues ? [...p.issues] : []
        const idx = currentIssues.indexOf(issue)
        if (checked && idx === -1) {
          currentIssues.push(issue)
        } else if (!checked && idx > -1) {
          currentIssues.splice(idx, 1)
        }
        return { ...p, issues: currentIssues }
      })
      return { previewPages: newPages, isPagesChecked: false }
    }),

  setPagesChecked: (checked) =>
    set(() => ({
      isPagesChecked: checked
    })),

  loadFromWorkSnapshot: (data) => {
    console.log('[PublishStore] Load from work snapshot:', data.workId)
    set({
      editingWorkId: data.workId,
      editingTimeline: data.timeline || [],
      formData: data.formData,
      uploadedFile: data.uploadedFile,
      previewPages: data.previewPages,
      coverPreviewUrl: data.previewPages[0]?.url || '',
      isPagesChecked: data.isPagesChecked
    })
  },

  resetPublish: () =>
    set(() => ({
      editingWorkId: null,
      editingTimeline: [],
      formData: initialFormData,
      uploadedFile: null,
      previewPages: [],
      coverPreviewUrl: '',
      isPagesChecked: false
    }))
}))

export default usePublishStore
