import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { Work, WorkStatus } from '@/types'
import { useWorksStore } from '@/store/works'
import WorkCard from '@/components/WorkCard'
import StatusBadge from '@/components/StatusBadge'
import { formatPrice } from '@/utils'
import styles from './index.module.scss'

type ViewMode = 'list' | 'overview'

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
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const filteredWorks = useMemo(() => {
    if (activeFilter === 'all') return works
    return works.filter((w) => w.status === activeFilter)
  }, [works, activeFilter])

  const stats = useMemo(() => ({
    total: works.length,
    published: works.filter((w) => w.status === 'published').length,
    reviewing: works.filter((w) => w.status === 'reviewing').length,
    totalViews: works.reduce((s, w) => s + (w.stats?.viewCount || 0), 0),
    totalPurchases: works.reduce((s, w) => s + (w.stats?.purchaseCount || 0), 0),
    totalFavorites: works.reduce((s, w) => s + (w.stats?.favoriteCount || 0), 0)
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

  const handleEditDraft = (work: Work) => {
    if (work.status === 'draft' || work.status === 'rejected') {
      Taro.navigateTo({
        url: `/pages/publish/index?editWorkId=${work.id}`
      })
    }
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

      <View className={styles.viewToggle}>
        <Text
          className={classnames(
            styles.viewToggleItem,
            viewMode === 'list' && styles.viewToggleItemActive
          )}
          onClick={() => setViewMode('list')}
        >
          📚 作品列表
        </Text>
        <Text
          className={classnames(
            styles.viewToggleItem,
            viewMode === 'overview' && styles.viewToggleItemActive
          )}
          onClick={() => setViewMode('overview')}
        >
          📊 运营概览
        </Text>
      </View>

      {viewMode === 'list' ? (
        <>
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
                <View key={work.id} style={{ position: 'relative' }}>
                  <WorkCard
                    work={work}
                    onClick={() => handleWorkClick(work)}
                  />
                  {(work.status === 'draft' || work.status === 'rejected') && (
                    <Text
                      className={styles.quickEditBtn}
                      onClick={(e) => {
                        e.stopPropagation?.()
                        handleEditDraft(work)
                      }}
                    >
                      ✏️
                    </Text>
                  )}
                </View>
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
        </>
      ) : (
        <>
          <View className={styles.statsRow}>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{stats.totalViews}</Text>
              <Text className={styles.statLabel}>总浏览</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue} style={{ color: '#10B981' }}>
                {stats.totalPurchases}
              </Text>
              <Text className={styles.statLabel}>总购买</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue} style={{ color: '#F59E0B' }}>
                {stats.totalFavorites}
              </Text>
              <Text className={styles.statLabel}>总收藏</Text>
            </View>
          </View>

          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>单刊运营数据</Text>
          </View>

          <View className={styles.overviewTableHeader}>
            <Text className={styles.overviewColWork}>作品</Text>
            <Text className={styles.overviewColNum}>浏览</Text>
            <Text className={styles.overviewColNum}>收藏</Text>
            <Text className={styles.overviewColNum}>购买</Text>
            <Text className={styles.overviewColNum}>试读</Text>
          </View>

          <View className={styles.overviewList}>
            {filteredWorks.length > 0 ? (
              filteredWorks.map((work) => (
                <View
                  key={work.id}
                  className={styles.overviewRow}
                  onClick={() => handleWorkClick(work)}
                >
                  <View className={styles.overviewColWork}>
                    <Image
                      className={styles.overviewCover}
                      src={work.coverUrl}
                      mode="aspectFill"
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text className={styles.overviewTitle}>{work.title}</Text>
                      <View style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <StatusBadge status={work.status} size="sm" />
                        <Text className={styles.overviewPrice}>
                          {work.price === 0 ? '免费' : formatPrice(work.price)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text className={styles.overviewColNum}>{work.stats.viewCount}</Text>
                  <Text className={styles.overviewColNum} style={{ color: '#F59E0B' }}>
                    {work.stats.favoriteCount}
                  </Text>
                  <Text className={styles.overviewColNum} style={{ color: '#10B981' }}>
                    {work.stats.purchaseCount}
                  </Text>
                  <Text className={styles.overviewColNum} style={{ color: '#8B5CF6' }}>
                    {work.stats.previewClickCount}
                  </Text>
                </View>
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📊</Text>
                <Text className={styles.emptyText}>暂无运营数据</Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

export default IndexPage
