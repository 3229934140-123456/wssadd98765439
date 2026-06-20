import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import { ScheduleReminder, ReminderType } from '@/types'
import { generateId } from '@/utils'
import { useScheduleStore } from './schedule'
import { useWorksStore } from './works'

interface RemindersState {
  reminders: ScheduleReminder[]
  refreshReminders: () => void
  markCompleted: (reminderId: string) => void
  removeReminder: (reminderId: string) => void
  getPendingReminders: () => ScheduleReminder[]
  getCompletedReminders: () => ScheduleReminder[]
}

const DAYS_BEFORE = 2

const daysBetween = (aISO: string, bISO: string): number => {
  const a = new Date(aISO)
  const b = new Date(bISO)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000))
}

const makeReminderForSchedule = (
  scheduleId: string,
  workId: string,
  workTitle: string,
  scheduleType: 'presale' | 'unlock' | 'discount' | 'offline',
  scheduleDateISO: string,
  scheduleTime: string,
  extraDurationDays?: number
): ScheduleReminder | null => {
  const now = new Date()
  const schedDate = new Date(scheduleDateISO)

  const typeMap: Record<string, { type: ReminderType; title: string; desc: string; offsetDays?: number }> = {
    presale: {
      type: 'presale-upcoming',
      title: '预售即将开始',
      desc: '还有{days}天开始预售，记得做好宣发准备~'
    },
    unlock: {
      type: 'unlock-upcoming',
      title: '正式解锁将至',
      desc: '还有{days}天正式解锁，确认内容和物料都准备好了吗？'
    },
    discount: {
      type: 'discount-ending',
      title: '折扣活动即将结束',
      desc: '折扣还有{days}天结束，可考虑是否续期或调整档期',
      offsetDays: extraDurationDays || 3
    },
    offline: {
      type: 'offline-upcoming',
      title: '即将下架',
      desc: '还有{days}天下架，如有需要请提前调整档期'
    }
  }

  const cfg = typeMap[scheduleType]
  if (!cfg) return null

  let dueDate = new Date(schedDate)
  if (cfg.offsetDays) {
    dueDate.setDate(dueDate.getDate() + cfg.offsetDays)
  }

  const daysUntil = daysBetween(now.toISOString(), dueDate.toISOString())
  if (daysUntil < 0 || daysUntil > DAYS_BEFORE + 14) return null

  return {
    id: generateId(),
    workId,
    workTitle,
    scheduleId,
    type: cfg.type,
    title: cfg.title,
    description: cfg.desc.replace('{days}', String(Math.max(0, daysUntil))),
    dueDate: dueDate.toISOString(),
    completed: false,
    createdAt: now.toISOString()
  }
}

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set, get) => ({
      reminders: [],

      refreshReminders: () => {
        const { schedules } = useScheduleStore.getState()
        const { works } = useWorksStore.getState()
        const existing = get().reminders
        const completedIds = new Set(existing.filter((r) => r.completed).map((r) => r.scheduleId + '-' + r.type))

        const newReminders: ScheduleReminder[] = []

        schedules.forEach((s) => {
          if (s.completed) return
          const work = works.find((w) => w.id === s.workId)
          if (!work || work.status === 'offline' || work.status === 'draft') return
          const r = makeReminderForSchedule(
            s.id,
            s.workId,
            s.workTitle,
            s.type,
            s.date,
            s.time,
            s.extraInfo?.duration
          )
          if (!r) return
          if (completedIds.has(s.id + '-' + r.type)) {
            r.completed = true
            r.completedAt = existing.find(
              (x) => x.scheduleId === s.id && x.type === r.type && x.completed
            )?.completedAt
          }
          newReminders.push(r)
        })

        set({ reminders: newReminders })
        console.log('[RemindersStore] Refreshed reminders:', newReminders.length)
      },

      markCompleted: (reminderId) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === reminderId
              ? { ...r, completed: true, completedAt: new Date().toISOString() }
              : r
          )
        }))
      },

      removeReminder: (reminderId) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== reminderId)
        }))
      },

      getPendingReminders: () => {
        return get()
          .reminders.filter((r) => !r.completed)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      },

      getCompletedReminders: () => {
        return get()
          .reminders.filter((r) => r.completed)
          .sort(
            (a, b) =>
              new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
          )
      }
    }),
    {
      name: 'doujinshi-reminders-storage',
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

export default useRemindersStore
