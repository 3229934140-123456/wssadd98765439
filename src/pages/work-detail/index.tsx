import React, { useMemo } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { RATING_LABELS, SCHEDULE_TYPE_LABELS, SCHEDULE_TYPE_COLORS } from '@/types'
import { useWorksStore } from '@/store/works'
import { useScheduleStore } from '@/store/schedule'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatPrice } from '@/utils'
import styles from './index.module.scss'

const SCHEDULE_ORDER = ['presale', 'unlock', 'discount', 'offline']

const WorkDetailPage: React.FC = () => {
  const router = useRouter()
  const workId = router.params.id as string

  const { getWork } = useWorksStore()
  const { getSchedulesByWork, removeSchedule } = useScheduleStore()

  const work = getWork(workId)

  const workSchedules = useMemo(() => {
    if (!workId) return []
    const schedules = getSchedulesByWork(workId)
    return schedules
      .slice()
      .sort((a, b) => {
        const idxA = SCHEDULE_ORDER.indexOf(a.type)
        const idxB = SCHEDULE_ORDER.indexOf(b.type)
        if (idxA !== idxB) return idxA - idxB
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
  }, [workId, getSchedulesByWork])

  const pagesWithIssues = useMemo(
    () => work?.previewPages.filter((p) => p.issues && p.issues.length > 0) || [],
    [work]
  )

  if (!work) {
    return (
      <View className={styles.container}>
        <Text style={{ color: '#9CA3AF' }}>作品不存在</Text>
      </View>
    )
  }

  const handleAddSchedule = () => {
    console.log('[WorkDetail] Navigate to add schedule for work:', workId)
    Taro.navigateTo({
      url: `/pages/schedule-setting/index?workId=${workId}&workTitle=${encodeURIComponent(work.title)}`
    })
  }

  const handleRemoveSchedule = (scheduleId: string, typeLabel: string) => {
    Taro.showModal({
      title: '删除档期',
      content: `确定要删除"${typeLabel}"吗？`,
      success: (res) => {
        if (res.confirm) {
          removeSchedule(scheduleId)
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }

  const cpText = work.cp.map((c) => c.name).join(' / ')

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.heroCard}>
        <Image
          className={styles.cover}
          src={work.coverUrl}
          mode="aspectFill"
          onError={(e) => console.error('[WorkDetail] Cover error:', e)}
        />
        <View className={styles.info}>
          <Text className={styles.title}>{work.title}</Text>
          <Text className={styles.metaRow}>原作：{work.originalWork}</Text>
          {cpText && <Text className={styles.metaRow}>CP：{cpText}</Text>}
          <Text className={styles.metaRow}>分级：{RATING_LABELS[work.rating]}</Text>
          <Text className={styles.metaRow}>共 {work.pages} 页</Text>
          <View className={styles.tags}>
            {work.tags.map((tag) => (
              <Text key={tag} className={styles.tag}>{tag}</Text>
            ))}
          </View>
          <View className={styles.statusSection}>
            <StatusBadge status={work.status} size="md" />
            <Text className={styles.priceTag}>
              {work.price === 0 ? '免费' : formatPrice(work.price)}
            </Text>
          </View>
        </View>
      </View>

      <Text className={styles.sectionTitle}>试读预览（前{work.previewPages.length}页）</Text>
      <View className={styles.previewSection}>
        <ScrollView className={styles.previewList} scrollX>
          {work.previewPages.map((page) => (
            <View key={page.index} className={styles.previewItem}>
              <Image
                className={styles.previewImage}
                src={page.url}
                mode="aspectFill"
              />
              <Text className={styles.previewIndex}>P{page.index}</Text>
              {page.issues && page.issues.length > 0 && (
                <View className={styles.issueMarkers}>
                  {page.issues.map((_, i) => (
                    <View key={i} className={styles.issueMarker} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        {pagesWithIssues.length > 0 && (
          <Text style={{ marginTop: 24, fontSize: 24, color: '#EF4444' }}>
            ⚠️ {pagesWithIssues.length} 页存在问题标记
          </Text>
        )}
      </View>

      <View className={styles.scheduleSection}>
        <View className={styles.scheduleHeader}>
          <Text className={styles.scheduleTitle}>发行档期</Text>
          <Text className={styles.addScheduleBtn} onClick={handleAddSchedule}>
            + 添加档期
          </Text>
        </View>

        {workSchedules.length > 0 ? (
          <View className={styles.timeline}>
            {workSchedules.map((schedule) => (
              <View
                key={schedule.id}
                className={styles.timelineItem}
                onClick={() => {
                  Taro.showActionSheet({
                    itemList: ['删除此档期'],
                    success: (res) => {
                      if (res.tapIndex === 0) {
                        handleRemoveSchedule(schedule.id, SCHEDULE_TYPE_LABELS[schedule.type])
                      }
                    }
                  })
                }}
              >
                <View
                  className={classnames(
                    styles.timelineDot,
                    schedule.completed && styles.completed
                  )}
                  style={{ color: SCHEDULE_TYPE_COLORS[schedule.type] }}
                >
                  {schedule.completed && <Text className={styles.timelineCheck}>✓</Text>}
                </View>
                <View
                  className={styles.timelineContent}
                  style={{ borderLeft: `6rpx solid ${SCHEDULE_TYPE_COLORS[schedule.type]}` }}
                >
                  <Text
                    className={styles.timelineType}
                    style={{ color: SCHEDULE_TYPE_COLORS[schedule.type] }}
                  >
                    {SCHEDULE_TYPE_LABELS[schedule.type]}
                    {schedule.completed && '（已完成）'}
                  </Text>
                  <Text
                    className={styles.timelineDate}
                    style={{ color: SCHEDULE_TYPE_COLORS[schedule.type] }}
                  >
                    {formatDate(schedule.date)} {schedule.time}
                  </Text>
                  {schedule.extraInfo?.discountRate && (
                    <Text className={styles.timelineExtra}>
                      {Math.round(schedule.extraInfo.discountRate * 10)}折优惠
                      {schedule.extraInfo.duration
                        ? ` · 持续${schedule.extraInfo.duration}天`
                        : ''}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyTimeline}>
            <Text className={styles.emptyIcon}>📅</Text>
            <Text className={styles.emptyText}>
              还未设置档期{'\n'}
              预售、解锁、折扣、下架都可以在这里安排哦~
            </Text>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View
          className={styles.primaryBtn}
          onClick={handleAddSchedule}
        >
          为这本作品设置档期
        </View>
      </View>
    </ScrollView>
  )
}

export default WorkDetailPage
