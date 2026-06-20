import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import {
  ScheduleNode,
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_COLORS,
  REMINDER_TYPE_LABELS,
  REMINDER_TYPE_COLORS
} from '@/types'
import { useScheduleStore } from '@/store/schedule'
import { useWorksStore } from '@/store/works'
import { useRemindersStore } from '@/store/reminders'
import Calendar from '@/components/Calendar'
import { formatDate } from '@/utils'
import styles from './index.module.scss'

type ScheduleViewMode = 'calendar' | 'byWork'
type MainViewMode = 'schedule' | 'reminders'
type ReminderTabMode = 'pending' | 'done'

const SCHEDULE_ORDER = ['presale', 'unlock', 'discount', 'offline']

const LEGEND_ITEMS = [
  { type: 'presale' as const },
  { type: 'unlock' as const },
  { type: 'discount' as const },
  { type: 'offline' as const }
]

const SchedulePage: React.FC = () => {
  const { schedules } = useScheduleStore()
  const { works } = useWorksStore()
  const {
    reminders,
    refreshReminders,
    markCompleted,
    getPendingReminders,
    getCompletedReminders
  } = useRemindersStore()

  const [mainMode, setMainMode] = useState<MainViewMode>('schedule')
  const [scheduleViewMode, setScheduleViewMode] = useState<ScheduleViewMode>('calendar')
  const [reminderTab, setReminderTab] = useState<ReminderTabMode>('pending')

  useEffect(() => {
    refreshReminders()
  }, [schedules, works, refreshReminders])

  const upcomingSchedules = useMemo(() => {
    const now = new Date()
    return schedules
      .filter((s) => !s.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [schedules])

  const worksWithSchedules = useMemo(() => {
    const workIds = new Set(schedules.map((s) => s.workId))
    works.forEach((w) => workIds.add(w.id))
    return works
      .filter((w) => workIds.has(w.id))
      .map((work) => ({
        work,
        schedules: schedules
          .filter((s) => s.workId === work.id)
          .slice()
          .sort((a, b) => {
            const idxA = SCHEDULE_ORDER.indexOf(a.type)
            const idxB = SCHEDULE_ORDER.indexOf(b.type)
            if (idxA !== idxB) return idxA - idxB
            return new Date(a.date).getTime() - new Date(b.date).getTime()
          })
      }))
  }, [works, schedules])

  const missingInfoTips = useMemo(() => {
    const tips: string[] = []
    const worksWithSchedule = new Set(schedules.map((s) => s.workId))
    const presaleWorks = new Set(schedules.filter((s) => s.type === 'presale').map((s) => s.workId))
    const unlockWorks = new Set(schedules.filter((s) => s.type === 'unlock').map((s) => s.workId))

    worksWithSchedule.forEach((workId) => {
      const workTitle = schedules.find((s) => s.workId === workId)?.workTitle
      if (workTitle && !presaleWorks.has(workId)) {
        tips.push(`《${workTitle}》还未设置预售时间`)
      }
      if (workTitle && !unlockWorks.has(workId)) {
        tips.push(`《${workTitle}》还未设置正式解锁时间`)
      }
    })

    if (tips.length === 0) {
      tips.push('当前所有档期信息已完善，继续保持！')
    }
    return tips.slice(0, 3)
  }, [schedules])

  const pendingReminders = useMemo(() => getPendingReminders(), [reminders, getPendingReminders])
  const completedReminders = useMemo(
    () => getCompletedReminders(),
    [reminders, getCompletedReminders]
  )

  const handleAddSchedule = () => {
    Taro.navigateTo({ url: '/pages/schedule-setting/index' })
  }

  const handleScheduleClick = (schedule: ScheduleNode) => {
    Taro.showToast({
      title: `${SCHEDULE_TYPE_LABELS[schedule.type]}：${schedule.workTitle}`,
      icon: 'none'
    })
  }

  const handleDateClick = (date: string) => {
    const daySchedules = schedules.filter(
      (s) => formatDate(s.date) === formatDate(date)
    )
    if (daySchedules.length > 0) {
      const titles = daySchedules.map(
        (s) => `${SCHEDULE_TYPE_LABELS[s.type]}：${s.workTitle}`
      ).join('\n')
      Taro.showModal({
        title: formatDate(date),
        content: titles,
        showCancel: false
      })
    }
  }

  const handleGoWorkDetail = (workId: string) => {
    Taro.navigateTo({
      url: `/pages/work-detail/index?id=${workId}`
    })
  }

  const handleAddWorkSchedule = (workId: string, workTitle: string) => {
    Taro.navigateTo({
      url: `/pages/schedule-setting/index?workId=${workId}&workTitle=${encodeURIComponent(workTitle)}`
    })
  }

  const handleReminderClick = (workId: string, scheduleId?: string) => {
    Taro.navigateTo({
      url: `/pages/work-detail/index?id=${workId}`
    })
  }

  const handleMarkReminderDone = (reminderId: string) => {
    markCompleted(reminderId)
    Taro.showToast({ title: '已标记完成', icon: 'success' })
  }

  const displayReminders = reminderTab === 'pending' ? pendingReminders : completedReminders

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.viewToggle}>
        <Text
          className={classnames(
            styles.viewToggleItem,
            mainMode === 'schedule' && styles.viewToggleItemActive
          )}
          onClick={() => setMainMode('schedule')}
        >
          📅 档期
        </Text>
        <Text
          className={classnames(
            styles.viewToggleItem,
            mainMode === 'reminders' && styles.viewToggleItemActive
          )}
          onClick={() => setMainMode('reminders')}
        >
          🔔 提醒中心 {pendingReminders.length > 0 && `(${pendingReminders.length})`}
        </Text>
      </View>

      {mainMode === 'schedule' ? (
        <>
          <View className={styles.viewToggle}>
            <Text
              className={classnames(
                styles.viewToggleItem,
                scheduleViewMode === 'calendar' && styles.viewToggleItemActive
              )}
              onClick={() => setScheduleViewMode('calendar')}
            >
              � 日历视图
            </Text>
            <Text
              className={classnames(
                styles.viewToggleItem,
                scheduleViewMode === 'byWork' && styles.viewToggleItemActive
              )}
              onClick={() => setScheduleViewMode('byWork')}
            >
              📚 作品维度
            </Text>
          </View>

          {scheduleViewMode === 'calendar' ? (
            <>
              <Text className={styles.sectionTitle}>档期日历</Text>
              <Calendar schedules={schedules} onDateClick={handleDateClick} />

              <View className={styles.sectionGap} />

              <View className={styles.legendCard}>
                <Text className={styles.legendTitle}>图例说明</Text>
                <View className={styles.legendList}>
                  {LEGEND_ITEMS.map((item) => (
                    <View key={item.type} className={styles.legendItem}>
                      <View
                        className={styles.legendDot}
                        style={{ backgroundColor: SCHEDULE_TYPE_COLORS[item.type] }}
                      />
                      <Text className={styles.legendLabel}>{SCHEDULE_TYPE_LABELS[item.type]}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.tipCard}>
                <Text className={styles.tipTitle}>
                  <Text className={styles.tipIcon}>💡</Text>
                  待完善提醒
                </Text>
                <View className={styles.tipList}>
                  {missingInfoTips.map((tip, i) => (
                    <Text key={i} className={styles.tipItem}>{tip}</Text>
                  ))}
                </View>
              </View>

              <View className={styles.upcomingCard}>
                <Text className={styles.sectionTitle}>即将到来</Text>
                {upcomingSchedules.length > 0 ? (
                  <View className={styles.scheduleList}>
                    {upcomingSchedules.map((schedule) => (
                      <View
                        key={schedule.id}
                        className={classnames(
                          styles.scheduleItem,
                          schedule.completed && styles.completed
                        )}
                        onClick={() => handleScheduleClick(schedule)}
                      >
                        <View
                          className={styles.scheduleIndicator}
                          style={{ backgroundColor: SCHEDULE_TYPE_COLORS[schedule.type] }}
                        />
                        <View className={styles.scheduleContent}>
                          <View className={styles.scheduleHeader}>
                            <Text className={styles.scheduleType}>
                              {SCHEDULE_TYPE_LABELS[schedule.type]}
                            </Text>
                            <Text className={styles.scheduleTime}>{schedule.time}</Text>
                          </View>
                          <Text className={styles.scheduleWork}>{schedule.workTitle}</Text>
                          <Text className={styles.scheduleDate}>{formatDate(schedule.date)}</Text>
                          {schedule.extraInfo?.discountRate && (
                            <Text className={styles.scheduleExtra}>
                              {Math.round(schedule.extraInfo.discountRate * 10)}折优惠
                              {schedule.extraInfo.duration ? `，持续${schedule.extraInfo.duration}天` : ''}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className={styles.emptyState}>
                    <Text className={styles.emptyIcon}>📅</Text>
                    <Text className={styles.emptyText}>暂无即将到来的档期</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              <Text className={styles.sectionTitle}>按作品管理档期</Text>
              {worksWithSchedules.length > 0 ? (
                <View className={styles.workScheduleList}>
                  {worksWithSchedules.map(({ work, schedules: workSchedules }) => (
                    <View key={work.id} className={styles.workScheduleCard}>
                      <View className={styles.workScheduleHeader}>
                        <Image
                          className={styles.workScheduleCover}
                          src={work.coverUrl}
                          mode="aspectFill"
                        />
                        <View className={styles.workScheduleInfo}>
                          <Text className={styles.workScheduleTitle}>{work.title}</Text>
                          <Text className={styles.workScheduleMeta}>
                            {work.originalWork} · {work.pages}页 · {workSchedules.length}个档期
                          </Text>
                        </View>
                        <View className={styles.workScheduleActions}>
                          <Text
                            className={classnames(
                              styles.workScheduleBtn,
                              styles.workScheduleBtnPrimary
                            )}
                            onClick={() => handleGoWorkDetail(work.id)}
                          >
                            查看详情
                          </Text>
                          <Text
                            className={classnames(
                              styles.workScheduleBtn,
                              styles.workScheduleBtnSecondary
                            )}
                            onClick={() => handleAddWorkSchedule(work.id, work.title)}
                          >
                            + 档期
                          </Text>
                        </View>
                      </View>

                      {workSchedules.length > 0 ? (
                        <View className={styles.miniTimeline}>
                          {workSchedules.map((s) => (
                            <View
                              key={s.id}
                              className={styles.miniTimelineItem}
                              onClick={() => handleScheduleClick(s)}
                            >
                              <View
                                className={styles.miniTimelineDot}
                                style={{ backgroundColor: SCHEDULE_TYPE_COLORS[s.type] }}
                              />
                              <Text className={styles.miniTimelineText}>
                                {SCHEDULE_TYPE_LABELS[s.type]}
                                {s.extraInfo?.discountRate
                                  ? ` · ${Math.round(s.extraInfo.discountRate * 10)}折`
                                  : ''}
                              </Text>
                              <Text className={styles.miniTimelineDate}>
                                {formatDate(s.date)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text
                          style={{
                            fontSize: 24,
                            color: '#9CA3AF',
                            fontStyle: 'italic',
                            padding: '16rpx 0'
                          }}
                        >
                          还没安排档期，点右侧"+ 档期"开始吧
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View className={styles.emptyWorksHint}>
                  <Text className={styles.emptyIcon} style={{ fontSize: 64 }}>📚</Text>
                  <Text className={styles.emptyWorksHintText}>
                    还没有作品，先去创建一本吧~
                  </Text>
                </View>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <View className={styles.viewToggle}>
            <Text
              className={classnames(
                styles.viewToggleItem,
                reminderTab === 'pending' && styles.viewToggleItemActive
              )}
              onClick={() => setReminderTab('pending')}
            >
              待处理 ({pendingReminders.length})
            </Text>
            <Text
              className={classnames(
                styles.viewToggleItem,
                reminderTab === 'done' && styles.viewToggleItemActive
              )}
              onClick={() => setReminderTab('done')}
            >
              已完成 ({completedReminders.length})
            </Text>
          </View>

          {displayReminders.length > 0 ? (
            <View className={styles.reminderList}>
              {displayReminders.map((r) => (
                <View
                  key={r.id}
                  className={classnames(
                    styles.reminderItem,
                    r.completed && styles.reminderItemDone
                  )}
                  onClick={() => handleReminderClick(r.workId, r.scheduleId)}
                >
                  <View
                    className={styles.reminderIndicator}
                    style={{ backgroundColor: REMINDER_TYPE_COLORS[r.type] }}
                  />
                  <View className={styles.reminderContent}>
                    <View className={styles.reminderHeader}>
                      <Text
                        className={styles.reminderType}
                        style={{ color: REMINDER_TYPE_COLORS[r.type] }}
                      >
                        {REMINDER_TYPE_LABELS[r.type]}
                      </Text>
                      <Text className={styles.reminderDue}>
                        {formatDate(r.dueDate)}
                      </Text>
                    </View>
                    <Text className={styles.reminderWork}>《{r.workTitle}》</Text>
                    <Text className={styles.reminderDesc}>{r.description}</Text>
                  </View>
                  {!r.completed && (
                    <Text
                      className={styles.reminderDoneBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkReminderDone(r.id)
                      }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🔔</Text>
              <Text className={styles.emptyText}>
                {reminderTab === 'pending' ? '暂无待处理提醒' : '暂无已完成提醒'}
              </Text>
            </View>
          )}
        </>
      )}

      {mainMode === 'schedule' && (
        <View className={styles.bottomBar}>
          <View className={styles.addBtn} onClick={handleAddSchedule}>
            添加新档期
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default SchedulePage
