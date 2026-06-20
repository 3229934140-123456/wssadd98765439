import React, { useState, useMemo } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { RatingLevel, WorkFileType, PublishFormData, WorkPage, RATING_LABELS } from '@/types'
import TagInput from '@/components/TagInput'
import PagePreview from '@/components/PagePreview'
import { formatPrice } from '@/utils'
import styles from './index.module.scss'

const RATING_OPTIONS: RatingLevel[] = ['G', 'PG', 'R15', 'R18']
const FILE_TYPE_OPTIONS: { type: WorkFileType; label: string; icon: string }[] = [
  { type: 'pdf', label: 'PDF 文件', icon: '📄' },
  { type: 'long-image', label: '长图', icon: '🖼️' },
  { type: 'epub', label: 'ePub', icon: '📱' }
]

const MOCK_PREVIEW_PAGES: WorkPage[] = Array.from({ length: 5 }, (_, i) => ({
  index: i + 1,
  url: `https://picsum.photos/id/${10 + i * 5}/600/800`,
  width: 600,
  height: 800,
  issues: []
}))

const PublishPage: React.FC = () => {
  const [formData, setFormData] = useState<PublishFormData>({
    title: '',
    originalWork: '',
    tags: [],
    cp: '',
    rating: 'G',
    pages: 0,
    price: 0
  })
  const [fileType, setFileType] = useState<WorkFileType | null>(null)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [previewPages, setPreviewPages] = useState<WorkPage[]>([])

  const canSubmit = useMemo(() => {
    return (
      formData.title.trim() !== '' &&
      formData.originalWork.trim() !== '' &&
      formData.pages > 0 &&
      formData.price >= 0 &&
      fileType !== null &&
      fileUploaded
    )
  }, [formData, fileType, fileUploaded])

  const handleInput = (key: keyof PublishFormData, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleUploadFile = () => {
    console.log('[PublishPage] Upload file clicked, type:', fileType)
    Taro.showLoading({ title: '处理中...' })
    setTimeout(() => {
      Taro.hideLoading()
      setFileUploaded(true)
      setPreviewPages(MOCK_PREVIEW_PAGES)
      if (formData.pages === 0) {
        setFormData((prev) => ({ ...prev, pages: 32 }))
      }
      Taro.showToast({ title: '文件解析成功', icon: 'success' })
    }, 1500)
  }

  const handleCheckPages = () => {
    console.log('[PublishPage] Navigate to preview check')
    Taro.navigateTo({ url: '/pages/preview/index' })
  }

  const handleSaveDraft = () => {
    console.log('[PublishPage] Save draft:', formData)
    Taro.showToast({ title: '草稿已保存', icon: 'success' })
  }

  const handleSubmit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请完善所有必填信息', icon: 'none' })
      return
    }
    console.log('[PublishPage] Submit for review:', formData)
    Taro.showModal({
      title: '确认提交',
      content: '提交后将进入审核流程，确定要提交吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '提交中...' })
          setTimeout(() => {
            Taro.hideLoading()
            Taro.showToast({ title: '已提交审核', icon: 'success' })
          }, 1000)
        }
      }
    })
  }

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>基本信息</Text>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            作品标题<Text className={styles.required}>*</Text>
          </Text>
          <Input
            className={styles.input}
            placeholder="请输入作品标题"
            value={formData.title}
            onInput={(e) => handleInput('title', e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            原作标签<Text className={styles.required}>*</Text>
          </Text>
          <Input
            className={styles.input}
            placeholder="例如：原神、魔道祖师"
            value={formData.originalWork}
            onInput={(e) => handleInput('originalWork', e.detail.value)}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>自定义标签</Text>
          <TagInput
            tags={formData.tags}
            onChange={(tags) => handleInput('tags', tags)}
            placeholder="回车添加标签"
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>CP（角色配对）</Text>
          <Input
            className={styles.input}
            placeholder="例如：主角A×主角B"
            value={formData.cp}
            onInput={(e) => handleInput('cp', e.detail.value)}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            分级提示<Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.ratingOptions}>
            {RATING_OPTIONS.map((r) => (
              <View
                key={r}
                className={classnames(
                  styles.ratingOption,
                  formData.rating === r && styles.ratingOptionActive,
                  r === 'R18' && styles.ratingR18
                )}
                onClick={() => handleInput('rating', r)}
              >
                {RATING_LABELS[r]}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            页数<Text className={styles.required}>*</Text>
          </Text>
          <Input
            className={styles.input}
            type="number"
            placeholder="请输入总页数"
            value={formData.pages > 0 ? String(formData.pages) : ''}
            onInput={(e) => handleInput('pages', parseInt(e.detail.value) || 0)}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            价格（元）<Text className={styles.required}>*</Text>
          </Text>
          <Input
            className={styles.input}
            type="digit"
            placeholder="0为免费"
            value={formData.price > 0 ? String(formData.price) : ''}
            onInput={(e) => handleInput('price', parseFloat(e.detail.value) || 0)}
          />
          {formData.price > 0 && (
            <Text className={styles.priceLabel}>
              售价：{formatPrice(formData.price)}
            </Text>
          )}
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>文件上传</Text>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            文件格式<Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.fileTypeOptions}>
            {FILE_TYPE_OPTIONS.map((opt) => (
              <View
                key={opt.type}
                className={classnames(
                  styles.fileTypeOption,
                  fileType === opt.type && styles.fileTypeOptionActive
                )}
                onClick={() => setFileType(opt.type)}
              >
                <Text className={styles.fileTypeIcon}>{opt.icon}</Text>
                <Text className={styles.fileTypeLabel}>{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {fileType && (
          <View className={styles.formGroup}>
            <Text className={styles.label}>
              上传文件<Text className={styles.required}>*</Text>
            </Text>
            {!fileUploaded ? (
              <View className={styles.uploadArea} onClick={handleUploadFile}>
                <Text className={styles.uploadIcon}>☁️</Text>
                <Text className={styles.uploadText}>点击上传文件</Text>
                <Text className={styles.uploadHint}>支持 PDF / 长图 / ePub，最大 100MB</Text>
              </View>
            ) : (
              <View className={styles.uploadArea} onClick={handleUploadFile}>
                <Text className={styles.uploadIcon}>✅</Text>
                <Text className={styles.uploadText}>文件已上传</Text>
                <Text className={styles.uploadHint}>点击可重新上传</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {fileUploaded && previewPages.length > 0 && (
        <View className={styles.previewSection}>
          <Text className={styles.sectionTitle}>预览效果</Text>

          <View className={styles.coverPreview}>
            <Image
              className={styles.coverImage}
              src={previewPages[0]?.url}
              mode="aspectFill"
            />
            <View className={styles.coverInfo}>
              <Text className={styles.coverTitle}>
                {formData.title || '未命名作品'}
              </Text>
              <Text className={styles.coverMeta}>
                原作：{formData.originalWork || '未填写'}{'\n'}
                分级：{RATING_LABELS[formData.rating]}{'\n'}
                共 {formData.pages} 页 · {formatPrice(formData.price)}
              </Text>
            </View>
          </View>

          <View className={styles.previewPagesTitle}>
            试读预览（前5页）
            <Text className={styles.previewPagesHint}>请确认内容无误</Text>
          </View>

          <ScrollView className={styles.previewPagesList} scrollX>
            {previewPages.map((page) => (
              <View key={page.index} className={styles.previewPageItem}>
                <PagePreview page={page} compact />
              </View>
            ))}
          </ScrollView>

          <View
            className={styles.pageCheckBtn}
            onClick={handleCheckPages}
          >
            逐页检查（缺页/糊字/方向）
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={styles.btnRow}>
          <View className={styles.btnSave} onClick={handleSaveDraft}>
            保存草稿
          </View>
          <View
            className={classnames(styles.btnSubmit, !canSubmit && styles.disabled)}
            onClick={handleSubmit}
          >
            提交审核
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default PublishPage
