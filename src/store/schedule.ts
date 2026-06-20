import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ScheduleNode } from '@/types'
import { mockScheduleNodes } from '@/data/schedule'
import { generateId } from '@/utils'

interface ScheduleState {
  schedules: ScheduleNode[]
  addSchedule: (schedule: Omit<ScheduleNode, 'id'>) => void
  removeSchedule: (id: string) => void
  updateSchedule: (id: string, data: Partial<ScheduleNode>) => void
  getSchedulesByWork: (workId: string) => ScheduleNode[]
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [...mockScheduleNodes],

      addSchedule: (schedule) =>
        set((state) => ({
          schedules: [
            ...state.schedules,
            {
              ...schedule,
              id: generateId()
            }
          ]
        })),

      removeSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id)
        })),

      updateSchedule: (id, data) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...data } : s
          )
        })),

      getSchedulesByWork: (workId) => {
        return get().schedules.filter((s) => s.workId === workId)
      }
    }),
    {
      name: 'doujinshi-schedule-storage',
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

export default useScheduleStore
