import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import classnames from 'classnames'
import { FeedbackItem as FeedbackItemType } from '@/types'
import { mockFeedback, mockWorkStats } from '@/data/feedback'
import FeedbackItem from '@/components/FeedbackItem'
import styles from './index.module.scss'

type FilterType = 'all' | 'comment' | 'typo'

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'comment', label: '短评' },
  { key: 'typo', label: '错字反馈' }
]

const FeedbackPage: React.FC = () => {
  const [feedback] = useState<FeedbackItemType[]>(mockFeedback)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const totalStats = useMemo(() => {
    const totalPurchases = mockWorkStats.reduce((sum, w) => sum + w.purchaseCount, 0)
    const totalFavorites = mockWorkStats.reduce((sum, w) => sum + w.favoriteCount, 0)
    const totalComments = feedback.filter((f) => f.type === 'comment').length
    const totalTypos = feedback.filter((f) => f.type === 'typo').length
    return { totalPurchases, totalFavorites, totalComments, totalTypos }
  }, [feedback])

  const filteredFeedback = useMemo(() => {
    if (activeFilter === 'all') return feedback
    return feedback.filter((f) => f.type === activeFilter)
  }, [feedback, activeFilter])

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.statsOverview}>
        <View className={classnames(styles.statCard, styles.statCardPurple)}>
          <Text className={styles.statIcon}>💰</Text>
          <Text className={styles.statValue}>{totalStats.totalPurchases}</Text>
          <Text className={styles.statLabel}>购买人数</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statCardPink)}>
          <Text className={styles.statIcon}>⭐</Text>
          <Text className={styles.statValue}>{totalStats.totalFavorites}</Text>
          <Text className={styles.statLabel}>收藏数</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statCardGreen)}>
          <Text className={styles.statIcon}>💬</Text>
          <Text className={styles.statValue}>{totalStats.totalComments}</Text>
          <Text className={styles.statLabel}>读者短评</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statCardOrange)}>
          <Text className={styles.statIcon}>✏️</Text>
          <Text className={styles.statValue}>{totalStats.totalTypos}</Text>
          <Text className={styles.statLabel}>错字反馈</Text>
        </View>
      </View>

      <View className={styles.worksStats}>
        <Text className={styles.sectionTitle}>各作品数据</Text>
        {mockWorkStats.map((work) => (
          <View key={work.workId} className={styles.workStatRow}>
            <Text className={styles.workStatName}>{work.workTitle}</Text>
            <View className={styles.workStatNumbers}>
              <View className={styles.workStatItem}>
                <Text className={styles.workStatItemValue}>{work.purchaseCount}</Text>
                <Text className={styles.workStatItemLabel}>购买</Text>
              </View>
              <View className={styles.workStatItem}>
                <Text className={styles.workStatItemValue}>{work.favoriteCount}</Text>
                <Text className={styles.workStatItemLabel}>收藏</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Text className={styles.sectionTitle}>读者留言</Text>

      <View className={styles.filterTabs}>
        {FILTER_TABS.map((tab) => (
          <Text
            key={tab.key}
            className={classnames(
              styles.filterTab,
              activeFilter === tab.key && styles.filterTabActive
            )}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </Text>
        ))}
      </View>

      <View className={styles.feedbackList}>
        {filteredFeedback.length > 0 ? (
          filteredFeedback.map((item) => (
            <FeedbackItem key={item.id} feedback={item} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无相关反馈</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export default FeedbackPage
