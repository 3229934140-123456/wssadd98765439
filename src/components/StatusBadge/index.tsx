import React from 'react'
import { View, Text } from '@tarojs/components'
import { WorkStatus, STATUS_LABELS, STATUS_COLORS } from '@/types'
import styles from './index.module.scss'
import classnames from 'classnames'

interface StatusBadgeProps {
  status: WorkStatus
  size?: 'sm' | 'md'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const color = STATUS_COLORS[status]
  const label = STATUS_LABELS[status]

  return (
    <View
      className={classnames(styles.badge, styles[size])}
      style={{ backgroundColor: `${color}15`, color: color }}
    >
      <View className={styles.dot} style={{ backgroundColor: color }} />
      <Text className={styles.text}>{label}</Text>
    </View>
  )
}

export default StatusBadge
