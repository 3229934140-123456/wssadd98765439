import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { ScheduleNode, SCHEDULE_TYPE_LABELS, SCHEDULE_TYPE_COLORS } from '@/types'
import { useScheduleStore } from '@/store/schedule'
import Calendar from '@/components/Calendar'
import { formatDate } from '@/utils'
import styles from './index.module.scss'

const LEGEND_ITEMS = [
  { type: 'presale' as const },
  { type: 'unlock' as const },
  { type: 'discount' as const },
  { type: 'offline' as const }
]

const SchedulePage: React.FC = () => {
  const { schedules } = useScheduleStore()

  const upcomingSchedules = useMemo(() => {
    const now = new Date()
    return schedules
      .filter((s) => !s.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [schedules])

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

  const handleAddSchedule = () => {
    console.log('[SchedulePage] Navigate to schedule setting')
    Taro.navigateTo({ url: '/pages/schedule-setting/index' })
  }

  const handleScheduleClick = (schedule: ScheduleNode) => {
    console.log('[SchedulePage] Click schedule:', schedule.id, schedule.type)
    Taro.showToast({ title: `${SCHEDULE_TYPE_LABELS[schedule.type]}：${schedule.workTitle}`, icon: 'none' })
  }

  const handleDateClick = (date: string) => {
    const daySchedules = schedules.filter(
      (s) => formatDate(s.date) === formatDate(date)
    )
    if (daySchedules.length > 0) {
      const titles = daySchedules.map((s) => `${SCHEDULE_TYPE_LABELS[s.type]}：${s.workTitle}`).join('\n')
      Taro.showModal({
        title: formatDate(date),
        content: titles,
        showCancel: false
      })
    }
  }

  return (
    <ScrollView className={styles.container} scrollY>
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

      <View className={styles.bottomBar}>
        <View className={styles.addBtn} onClick={handleAddSchedule}>
          添加新档期
        </View>
      </View>
    </ScrollView>
  )
}

export default SchedulePage
