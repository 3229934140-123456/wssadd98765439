import React, { useState, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { getDaysInMonth, getFirstDayOfMonth, isSameDay, isToday } from '@/utils'
import { ScheduleNode, SCHEDULE_TYPE_COLORS } from '@/types'
import styles from './index.module.scss'

interface CalendarProps {
  schedules?: ScheduleNode[]
  onDateClick?: (date: string) => void
}

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

const Calendar: React.FC<CalendarProps> = ({ schedules = [], onDateClick }) => {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(now.toISOString())

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const calendarDays = useMemo(() => {
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = []

    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1)
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const date = new Date(currentYear, currentMonth - 1, day).toISOString()
      days.push({ date, day, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i).toISOString()
      days.push({ date, day: i, isCurrentMonth: true })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(currentYear, currentMonth + 1, i).toISOString()
      days.push({ date, day: i, isCurrentMonth: false })
    }

    return days
  }, [currentYear, currentMonth, firstDay, daysInMonth])

  const getSchedulesForDate = (date: string): ScheduleNode[] => {
    return schedules.filter((s) => isSameDay(s.date, date))
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(11)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    onDateClick?.(date)
    console.log('[Calendar] Date selected:', date)
  }

  return (
    <View className={styles.calendar}>
      <View className={styles.header}>
        <Text className={styles.navBtn} onClick={handlePrevMonth}>‹</Text>
        <Text className={styles.monthTitle}>{currentYear}年{currentMonth + 1}月</Text>
        <Text className={styles.navBtn} onClick={handleNextMonth}>›</Text>
      </View>

      <View className={styles.weekDays}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} className={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <View className={styles.daysGrid}>
        {calendarDays.map(({ date, day, isCurrentMonth }) => {
          const daySchedules = getSchedulesForDate(date)
          const hasSchedule = daySchedules.length > 0
          const isSelected = isSameDay(date, selectedDate)
          const today = isToday(date)

          return (
            <View
              key={date}
              className={classnames(
                styles.dayCell,
                !isCurrentMonth && styles.otherMonth,
                isSelected && styles.selected,
                today && styles.today
              )}
              onClick={() => handleDateClick(date)}
            >
              <Text className={styles.dayNumber}>{day}</Text>
              {hasSchedule && (
                <View className={styles.scheduleDots}>
                  {daySchedules.slice(0, 3).map((s) => (
                    <View
                      key={s.id}
                      className={styles.dot}
                      style={{ backgroundColor: SCHEDULE_TYPE_COLORS[s.type] }}
                    />
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default Calendar
