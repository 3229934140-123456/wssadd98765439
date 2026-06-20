import React, { useState, useMemo } from 'react'
import { View, Text, Image, Input, Slider, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { mockWorks } from '@/data/works'
import { ScheduleType, SCHEDULE_TYPE_LABELS, SCHEDULE_TYPE_COLORS } from '@/types'
import { formatDate } from '@/utils'
import styles from './index.module.scss'

const TYPE_OPTIONS: { type: ScheduleType; desc: string }[] = [
  { type: 'presale', desc: '读者可提前购买，但暂不可阅读' },
  { type: 'unlock', desc: '正式开放阅读权限' },
  { type: 'discount', desc: '设置限时折扣活动' },
  { type: 'offline', desc: '到期后自动下架不再售卖' }
]

const ScheduleSettingPage: React.FC = () => {
  const works = mockWorks.filter((w) => w.status !== 'offline')

  const [selectedWorkId, setSelectedWorkId] = useState<string>('')
  const [selectedType, setSelectedType] = useState<ScheduleType | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [discountRate, setDiscountRate] = useState<number>(80)
  const [discountDuration, setDiscountDuration] = useState<string>('3')

  const canSave = useMemo(() => {
    const baseValid = selectedWorkId && selectedType && selectedDate && selectedTime
    if (!baseValid) return false
    if (selectedType === 'discount') {
      return discountDuration && parseInt(discountDuration) > 0
    }
    return true
  }, [selectedWorkId, selectedType, selectedDate, selectedTime, discountDuration])

  const handleCancel = () => {
    console.log('[ScheduleSettingPage] Cancel')
    Taro.navigateBack()
  }

  const handleSave = () => {
    if (!canSave) {
      Taro.showToast({ title: '请完善所有信息', icon: 'none' })
      return
    }
    console.log('[ScheduleSettingPage] Save schedule:', {
      workId: selectedWorkId,
      type: selectedType,
      date: selectedDate,
      time: selectedTime,
      discountRate: selectedType === 'discount' ? discountRate / 100 : undefined,
      duration: selectedType === 'discount' ? parseInt(discountDuration) : undefined
    })
    Taro.showLoading({ title: '保存中...' })
    setTimeout(() => {
      Taro.hideLoading()
      Taro.showToast({ title: '档期已添加', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    }, 800)
  }

  return (
    <View className={styles.container}>
      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>选择作品</Text>
        <View className={styles.workOptions}>
          {works.map((work) => (
            <View
              key={work.id}
              className={classnames(
                styles.workOption,
                selectedWorkId === work.id && styles.workOptionActive
              )}
              onClick={() => setSelectedWorkId(work.id)}
            >
              <Image
                className={styles.workOptionCover}
                src={work.coverUrl}
                mode="aspectFill"
              />
              <View className={styles.workOptionInfo}>
                <Text className={styles.workOptionTitle}>{work.title}</Text>
                <Text className={styles.workOptionMeta}>{work.originalWork} · {work.pages}页</Text>
              </View>
              <View className={styles.workOptionCheck}>
                {selectedWorkId === work.id && (
                  <Text className={styles.workOptionCheckText}>✓</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>档期类型</Text>
        <View className={styles.typeOptions}>
          {TYPE_OPTIONS.map((opt) => (
            <View
              key={opt.type}
              className={classnames(
                styles.typeOption,
                selectedType === opt.type && styles.typeOptionActive
              )}
              style={{ color: SCHEDULE_TYPE_COLORS[opt.type] }}
              onClick={() => setSelectedType(opt.type)}
            >
              <View
                className={styles.typeDot}
                style={{ backgroundColor: SCHEDULE_TYPE_COLORS[opt.type] }}
              />
              <View style={{ flex: 1 }}>
                <Text className={styles.typeLabel}>{SCHEDULE_TYPE_LABELS[opt.type]}</Text>
                <Text className={styles.typeDesc}>{opt.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>设置时间</Text>
        <View className={styles.formGroup}>
          <Text className={styles.label}>
            日期<Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.dateTimeRow}>
            <View className={styles.dateTimeItem}>
              <Picker
                mode="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.detail.value)}
              >
                <View className={styles.datePicker}>
                  {selectedDate ? (
                    formatDate(selectedDate + 'T00:00:00')
                  ) : (
                    <Text className={styles.datePickerPlaceholder}>选择日期</Text>
                  )}
                </View>
              </Picker>
            </View>
            <View className={styles.dateTimeItem}>
              <Picker
                mode="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.detail.value)}
              >
                <View className={styles.datePicker}>
                  {selectedTime || <Text className={styles.datePickerPlaceholder}>选择时间</Text>}
                </View>
              </Picker>
            </View>
          </View>
        </View>

        {selectedType === 'discount' && (
          <View className={styles.discountSection}>
            <Text className={styles.discountTitle}>折扣设置</Text>
            <View className={styles.formGroup}>
              <Text className={styles.label}>折扣力度</Text>
              <View className={styles.sliderWrapper}>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  value={discountRate}
                  activeColor="#F59E0B"
                  backgroundColor="#F3F4F6"
                  blockColor="#F59E0B"
                  blockSize={24}
                  onChange={(e) => setDiscountRate(e.detail.value)}
                />
                <View className={styles.sliderLabels}>
                  <Text className={styles.sliderLabel}>1折</Text>
                  <Text className={styles.sliderLabel}>原价</Text>
                </View>
              </View>
              <Text className={styles.sliderValue}>{(discountRate / 10).toFixed(1)}折</Text>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.label}>活动持续天数</Text>
              <Input
                className={styles.durationInput}
                type="number"
                placeholder="请输入天数"
                value={discountDuration}
                onInput={(e) => setDiscountDuration(e.detail.value)}
              />
            </View>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.btnRow}>
          <View className={styles.btnCancel} onClick={handleCancel}>
            取消
          </View>
          <View className={styles.btnSave} onClick={handleSave}>
            保存档期
          </View>
        </View>
      </View>
    </View>
  )
}

export default ScheduleSettingPage
