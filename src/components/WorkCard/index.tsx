import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Work, RATING_LABELS } from '@/types'
import { formatPrice, formatDate } from '@/utils'
import StatusBadge from '@/components/StatusBadge'
import styles from './index.module.scss'

interface WorkCardProps {
  work: Work
  onClick?: () => void
}

const WorkCard: React.FC<WorkCardProps> = ({ work, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      console.log('[WorkCard] Click work:', work.id, work.title)
    }
  }

  return (
    <View className={styles.card} onClick={handleClick}>
      <Image
        className={styles.cover}
        src={work.coverUrl}
        mode="aspectFill"
        onError={(e) => console.error('[WorkCard] Image load error:', e)}
      />
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.title}>{work.title}</Text>
          <StatusBadge status={work.status} />
        </View>
        <View className={styles.meta}>
          <Text className={styles.metaText}>{work.originalWork}</Text>
          <View className={styles.divider} />
          <Text className={styles.metaText}>{RATING_LABELS[work.rating]}</Text>
        </View>
        <View className={styles.tags}>
          {work.tags.slice(0, 3).map((tag) => (
            <View key={tag} className={styles.tag}>
              {tag}
            </View>
          ))}
        </View>
        <View className={styles.footer}>
          <View className={styles.stats}>
            <Text className={styles.stat}>共{work.pages}页</Text>
            <Text className={styles.stat}>{formatPrice(work.price)}</Text>
          </View>
          <Text className={styles.date}>{formatDate(work.createdAt)}</Text>
        </View>
        {work.rejectReason && (
          <View className={styles.rejectBox}>
            <Text className={styles.rejectLabel}>驳回原因：</Text>
            <Text className={styles.rejectText}>{work.rejectReason}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default WorkCard
