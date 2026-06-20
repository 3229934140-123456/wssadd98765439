import React, { useState, useMemo } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { WorkPage } from '@/types'
import styles from './index.module.scss'

type IssueType = 'missing' | 'blurry' | 'wrong-direction'

const ISSUE_OPTIONS: { type: IssueType; label: string; icon: string }[] = [
  { type: 'missing', label: '缺页', icon: '📄' },
  { type: 'blurry', label: '糊字', icon: '🔍' },
  { type: 'wrong-direction', label: '方向错', icon: '🔄' }
]

const MOCK_PAGES: WorkPage[] = Array.from({ length: 5 }, (_, i) => ({
  index: i + 1,
  url: `https://picsum.photos/id/${20 + i * 8}/800/1100`,
  width: 800,
  height: 1100,
  issues: i === 2 ? ['blurry'] : []
}))

const PreviewPage: React.FC = () => {
  const [pages, setPages] = useState<WorkPage[]>(MOCK_PAGES)
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentPage = pages[currentIndex]

  const pagesWithIssues = useMemo(
    () => pages.filter((p) => p.issues && p.issues.length > 0),
    [pages]
  )

  const toggleIssue = (issueType: IssueType) => {
    setPages((prev) => {
      const newPages = [...prev]
      const page = { ...newPages[currentIndex] }
      const currentIssues = page.issues ? [...page.issues] : []
      const existingIndex = currentIssues.indexOf(issueType)
      if (existingIndex > -1) {
        currentIssues.splice(existingIndex, 1)
      } else {
        currentIssues.push(issueType)
      }
      page.issues = currentIssues
      newPages[currentIndex] = page
      return newPages
    })
  }

  const goToPage = (index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentIndex(index)
      console.log('[PreviewPage] Navigate to page:', index + 1)
    }
  }

  const handleBack = () => {
    console.log('[PreviewPage] Go back with issues count:', pagesWithIssues.length)
    Taro.navigateBack()
  }

  const handleConfirm = () => {
    console.log('[PreviewPage] Confirm check, total issues:', pagesWithIssues.length)
    if (pagesWithIssues.length > 0) {
      Taro.showModal({
        title: '确认提交',
        content: `共有${pagesWithIssues.length}页存在问题标记，是否仍确认检查完成？`,
        success: (res) => {
          if (res.confirm) {
            Taro.showToast({ title: '检查完成', icon: 'success' })
            setTimeout(() => Taro.navigateBack(), 1000)
          }
        }
      })
    } else {
      Taro.showToast({ title: '全部页面检查通过', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    }
  }

  return (
    <View className={styles.container}>
      <View className={styles.previewMain}>
        <View className={styles.mainImageWrapper}>
          <Image
            className={styles.mainImage}
            src={currentPage?.url}
            mode="aspectFit"
            onError={(e) => console.error('[PreviewPage] Image load error:', e)}
          />
          <View className={styles.pageIndicator}>
            <Text className={styles.pageIndicatorText}>
              {currentIndex + 1} / {pages.length}
            </Text>
          </View>
          <View
            className={classnames(styles.navBtn, styles.navBtnPrev, currentIndex === 0 && styles.navBtnDisabled)}
            onClick={() => goToPage(currentIndex - 1)}
          >
            <Text className={styles.navBtnText}>‹</Text>
          </View>
          <View
            className={classnames(styles.navBtn, styles.navBtnNext, currentIndex === pages.length - 1 && styles.navBtnDisabled)}
            onClick={() => goToPage(currentIndex + 1)}
          >
            <Text className={styles.navBtnText}>›</Text>
          </View>
        </View>
      </View>

      <View className={styles.thumbnailBar}>
        <ScrollView className={styles.thumbnailList} scrollX>
          {pages.map((page, index) => (
            <View
              key={page.index}
              className={classnames(
                styles.thumbnailItem,
                index === currentIndex && styles.thumbnailActive
              )}
              onClick={() => goToPage(index)}
            >
              <Image
                className={styles.thumbnailImage}
                src={page.url}
                mode="aspectFill"
              />
              <Text className={styles.thumbnailPageNum}>{page.index}</Text>
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
      </View>

      <View className={styles.bottomBar}>
        {pagesWithIssues.length > 0 && (
          <View className={styles.issueSummary}>
            <Text className={styles.issueSummaryText}>已标记问题页面</Text>
            <Text className={styles.issueSummaryCount}>{pagesWithIssues.length} 页</Text>
          </View>
        )}

        <Text className={styles.issueSectionTitle}>标记当前页问题：</Text>
        <View className={styles.issueButtons}>
          {ISSUE_OPTIONS.map((opt) => (
            <View
              key={opt.type}
              className={classnames(
                styles.issueBtn,
                currentPage?.issues?.includes(opt.type) && styles.issueBtnActive
              )}
              onClick={() => toggleIssue(opt.type)}
            >
              {opt.icon} {opt.label}
            </View>
          ))}
        </View>

        <View className={styles.actionRow}>
          <View className={styles.backBtn} onClick={handleBack}>
            返回编辑
          </View>
          <View className={styles.confirmBtn} onClick={handleConfirm}>
            确认检查完成
          </View>
        </View>
      </View>
    </View>
  )
}

export default PreviewPage
