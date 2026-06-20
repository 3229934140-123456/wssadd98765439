import React, { useMemo } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import {
  RATING_LABELS,
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_COLORS,
  REVIEW_STAGE_LABELS,
  REVIEW_STAGE_COLORS,
  ReviewStage
} from '@/types'
import { useWorksStore } from '@/store/works'
import { useScheduleStore } from '@/store/schedule'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatPrice } from '@/utils'
import styles from './index.module.scss'

const SCHEDULE_ORDER = ['presale', 'unlock', 'discount', 'offline']
const REVIEW_STAGES: ReviewStage[] = ['submitted', 'reviewing', 'need-fix', 'passed']

const WorkDetailPage: React.FC = () => {
  const router = useRouter()
  const workId = router.params.id as string

  const { getWork, setReviewStage } = useWorksStore()
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

  const currentStageIdx = useMemo(() => {
    if (!work?.reviewStage) return -1
    return REVIEW_STAGES.indexOf(work.reviewStage)
  }, [work?.reviewStage])

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

  const handleContinueEditing = () => {
    console.log('[WorkDetail] Continue editing draft/rejected work:', work.id)
    Taro.navigateTo({
      url: `/pages/publish/index?editWorkId=${work.id}`
    })
  }

  const handleMockReviewAction = (nextStage: ReviewStage) => {
    Taro.showActionSheet({
      itemList: [
        nextStage === 'need-fix' ? '模拟审核不通过（带原因）' : '模拟审核通过',
        '取消'
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          if (nextStage === 'need-fix') {
            Taro.showModal({
              title: '填写驳回原因',
              editable: true,
              placeholderText: '请输入驳回原因',
              success: (r) => {
                if (r.confirm) {
                  const reason = r.content || '内容需要调整'
                  setReviewStage(work.id, 'need-fix', reason)
                  Taro.showToast({ title: '已模拟驳回', icon: 'none' })
                }
              }
            })
          } else {
            setReviewStage(work.id, 'passed')
            Taro.showToast({ title: '已模拟通过', icon: 'success' })
          }
        }
      }
    })
  }

  const cpText = work.cp.map((c) => c.name).join(' / ')

  const totalTrendViews = work.stats?.trend?.reduce((s, p) => s + p.views, 0) || 0
  const totalTrendPurchases = work.stats?.trend?.reduce((s, p) => s + p.purchases, 0) || 0
  const maxTrendViews = Math.max(1, ...(work.stats?.trend?.map((p) => p.views) || [1]))

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

      {(work.status === 'reviewing' || work.status === 'rejected' || work.status === 'published') && (
        <View className={styles.reviewCard}>
          <Text className={styles.sectionTitle}>审核进度</Text>
          <View className={styles.reviewTimeline}>
            {REVIEW_STAGES.map((stage, idx) => {
              const active = idx <= currentStageIdx
              const isCurrent = idx === currentStageIdx
              return (
                <View key={stage} className={styles.reviewStep}>
                  <View
                    className={classnames(styles.reviewDot, active && styles.reviewDotActive)}
                    style={{
                      backgroundColor: active ? REVIEW_STAGE_COLORS[stage] : '#E5E7EB',
                      borderColor: isCurrent ? REVIEW_STAGE_COLORS[stage] : 'transparent'
                    }}
                  >
                    {active && <Text className={styles.reviewDotCheck}>✓</Text>}
                  </View>
                  <View className={styles.reviewStepContent}>
                    <Text
                      className={styles.reviewStepLabel}
                      style={{
                        color: active ? REVIEW_STAGE_COLORS[stage] : '#9CA3AF',
                        fontWeight: isCurrent ? 600 : 400
                      }}
                    >
                      {REVIEW_STAGE_LABELS[stage]}
                      {isCurrent && '（当前）'}
                    </Text>
                    {isCurrent && work.reviewUpdatedAt && (
                      <Text className={styles.reviewStepTime}>
                        {formatDate(work.reviewUpdatedAt)} 更新
                      </Text>
                    )}
                  </View>
                </View>
              )
            })}
          </View>

          {work.status === 'rejected' && work.rejectReason && (
            <View className={styles.rejectBox}>
              <Text className={styles.rejectTitle}>💡 审核意见</Text>
              <Text className={styles.rejectText}>{work.rejectReason}</Text>
            </View>
          )}

          {(work.status === 'draft' || work.status === 'rejected') && (
            <View className={styles.editActions}>
              <View
                className={styles.primaryBtnSmall}
                onClick={handleContinueEditing}
              >
                ✏️ 继续编辑并重新提交
              </View>
            </View>
          )}

          {work.status === 'reviewing' && (
            <View className={styles.editActions}>
              <Text
                className={styles.reviewHintText}
                onClick={() => handleMockReviewAction('need-fix')}
              >
                🔧 模拟：驳回
              </Text>
              <Text
                className={styles.reviewHintText}
                style={{ color: '#10B981' }}
                onClick={() => handleMockReviewAction('passed')}
              >
                ✅ 模拟：通过
              </Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.statsCard}>
        <Text className={styles.sectionTitle}>运营数据</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{work.stats.viewCount}</Text>
            <Text className={styles.statLabel}>浏览</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum} style={{ color: '#F59E0B' }}>{work.stats.favoriteCount}</Text>
            <Text className={styles.statLabel}>收藏</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum} style={{ color: '#10B981' }}>{work.stats.purchaseCount}</Text>
            <Text className={styles.statLabel}>购买</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum} style={{ color: '#8B5CF6' }}>{work.stats.previewClickCount}</Text>
            <Text className={styles.statLabel}>试读点击</Text>
          </View>
        </View>

        <Text className={styles.trendTitle}>近 7 天浏览趋势</Text>
        <View className={styles.trendChart}>
          {work.stats.trend.map((p) => {
            const h = (p.views / maxTrendViews) * 100
            return (
              <View key={p.date} className={styles.trendBarCol}>
                <Text className={styles.trendBarValue}>{p.views}</Text>
                <View className={styles.trendBarOuter}>
                  <View
                    className={styles.trendBarInner}
                    style={{ height: `${Math.max(10, h)}%` }}
                  />
                </View>
                <Text className={styles.trendBarLabel}>
                  {p.date.slice(5)}
                </Text>
              </View>
            )
          })}
        </View>
        <Text className={styles.trendSummary}>
          近 7 天共 {totalTrendViews} 次浏览 · {totalTrendPurchases} 次购买
        </Text>
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
