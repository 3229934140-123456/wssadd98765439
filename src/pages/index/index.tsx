import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { Work, WorkStatus } from '@/types'
import { useWorksStore } from '@/store/works'
import WorkCard from '@/components/WorkCard'
import styles from './index.module.scss'

const FILTER_TABS: { key: WorkStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'reviewing', label: '审核中' },
  { key: 'published', label: '已发布' },
  { key: 'rejected', label: '已驳回' }
]

const IndexPage: React.FC = () => {
  const { works } = useWorksStore()
  const [activeFilter, setActiveFilter] = useState<WorkStatus | 'all'>('all')

  const filteredWorks = useMemo(() => {
    if (activeFilter === 'all') return works
    return works.filter((w) => w.status === activeFilter)
  }, [works, activeFilter])

  const stats = useMemo(() => ({
    total: works.length,
    published: works.filter((w) => w.status === 'published').length,
    reviewing: works.filter((w) => w.status === 'reviewing').length
  }), [works])

  const handleAddNew = () => {
    console.log('[IndexPage] Navigate to publish page')
    Taro.switchTab({ url: '/pages/publish/index' })
  }

  const handleWorkClick = (work: Work) => {
    console.log('[IndexPage] Click work, navigate to detail:', work.id, work.title)
    Taro.navigateTo({
      url: `/pages/work-detail/index?id=${work.id}`,
      fail: (err) => {
        console.error('[IndexPage] Navigate fail:', err)
        Taro.showToast({ title: work.title, icon: 'none' })
      }
    })
  }

  return (
    <ScrollView
      className={styles.container}
      scrollY
      onPullDownRefresh={() => {
        console.log('[IndexPage] Pull down refresh, works count:', works.length)
        setTimeout(() => Taro.stopPullDownRefresh(), 500)
      }}
    >
      <View className={styles.header}>
        <Text className={styles.greeting}>你好，创作者</Text>
        <Text className={styles.subtitle}>今天也要好好创作哦~</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{stats.total}</Text>
          <Text className={styles.statLabel}>作品总数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#10B981' }}>{stats.published}</Text>
          <Text className={styles.statLabel}>已发布</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue} style={{ color: '#F59E0B' }}>{stats.reviewing}</Text>
          <Text className={styles.statLabel}>审核中</Text>
        </View>
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>作品列表</Text>
      </View>

      <ScrollView className={styles.filterTabs} scrollX>
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
      </ScrollView>

      <View className={styles.workList}>
        {filteredWorks.length > 0 ? (
          filteredWorks.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onClick={() => handleWorkClick(work)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📚</Text>
            <Text className={styles.emptyText}>还没有作品，快去创建第一本电子刊吧！</Text>
            <View className={styles.emptyBtn} onClick={handleAddNew}>
              创建新刊
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export default IndexPage
