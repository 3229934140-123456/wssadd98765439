import { create } from 'zustand'
import { WorkPage, WorkFileType, RatingLevel, PublishFormData } from '@/types'
import { generateId } from '@/utils'

interface UploadedFileInfo {
  name: string
  type: WorkFileType
  size: number
  tempFilePath: string
}

interface PublishState {
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

  resetPublish: () =>
    set(() => ({
      formData: initialFormData,
      uploadedFile: null,
      previewPages: [],
      coverPreviewUrl: '',
      isPagesChecked: false
    }))
}))

export default usePublishStore
