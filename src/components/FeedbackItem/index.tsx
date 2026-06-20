import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { FeedbackItem as FeedbackItemType } from '@/types'
import { formatDateTime } from '@/utils'
import styles from './index.module.scss'

interface FeedbackItemProps {
  feedback: FeedbackItemType
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ feedback }) => {
  const isTypo = feedback.type === 'typo'

  return (
    <View className={styles.item}>
      <View className={styles.header}>
        <View className={classnames(styles.typeTag, isTypo ? styles.typo : styles.comment)}>
          {isTypo ? '错字反馈' : '读者短评'}
        </View>
        <Text className={styles.time}>{formatDateTime(feedback.createdAt)}</Text>
      </View>
      <Text className={styles.workTitle}>{feedback.workTitle}</Text>
      <Text className={styles.content}>{feedback.content}</Text>
      {feedback.pageNumber && (
        <View className={styles.pageInfo}>
          <Text className={styles.pageLabel}>第{feedback.pageNumber}页</Text>
        </View>
      )}
      <View className={styles.footer}>
        <Text className={styles.userName}>— {feedback.userName}</Text>
      </View>
    </View>
  )
}

export default FeedbackItem
