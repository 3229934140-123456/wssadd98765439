import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import classnames from 'classnames'
import { WorkPage } from '@/types'
import styles from './index.module.scss'

interface PagePreviewProps {
  page: WorkPage
  onClick?: () => void
  selected?: boolean
  compact?: boolean
}

const ISSUE_LABELS: Record<string, string> = {
  missing: '缺页',
  blurry: '糊字',
  'wrong-direction': '方向错'
}

const PagePreview: React.FC<PagePreviewProps> = ({ page, onClick, selected, compact }) => {
  const hasIssues = page.issues && page.issues.length > 0

  return (
    <View
      className={classnames(
        styles.page,
        selected && styles.selected,
        compact && styles.compact,
        hasIssues && styles.hasIssues
      )}
      onClick={onClick}
    >
      <Image
        className={styles.image}
        src={page.url}
        mode="aspectFit"
        onError={(e) => console.error('[PagePreview] Image load error:', e)}
      />
      <View className={styles.pageNumber}>
        <Text className={styles.pageNumberText}>第{page.index}页</Text>
      </View>
      {hasIssues && (
        <View className={styles.issues}>
          {page.issues!.map((issue) => (
            <View key={issue} className={styles.issueTag}>
              {ISSUE_LABELS[issue]}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default PagePreview
