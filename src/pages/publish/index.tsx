import React, { useMemo } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { RatingLevel, WorkFileType, RATING_LABELS, WorkPage } from '@/types'
import TagInput from '@/components/TagInput'
import PagePreview from '@/components/PagePreview'
import { formatPrice } from '@/utils'
import { usePublishStore } from '@/store/publish'
import styles from './index.module.scss'

const RATING_OPTIONS: RatingLevel[] = ['G', 'PG', 'R15', 'R18']
const FILE_TYPE_OPTIONS: { type: WorkFileType; label: string; icon: string }[] = [
  { type: 'pdf', label: 'PDF 文件', icon: '📄' },
  { type: 'long-image', label: '长图', icon: '🖼️' },
  { type: 'epub', label: 'ePub', icon: '📱' }
]

const generatePreviewPagesFromFile = (filePath: string, fileType: WorkFileType, pageCount: number): WorkPage[] => {
  const seed = Math.floor(Math.random() * 50)
  const count = Math.min(pageCount, 5)
  return Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    url: `https://picsum.photos/seed/${seed + i * 3}/600/800`,
    width: 600,
    height: 800,
    issues: []
  }))
}

const PublishPage: React.FC = () => {
  const {
    formData,
    uploadedFile,
    previewPages,
    isPagesChecked,
    setFormData,
    setUploadedFile,
    setPreviewPages,
    setPagesChecked
  } = usePublishStore()

  const fileType = uploadedFile?.type || null
  const fileUploaded = !!uploadedFile
  const pagesWithIssues = useMemo(
    () => previewPages.filter((p) => p.issues && p.issues.length > 0),
    [previewPages]
  )

  const canSubmit = useMemo(() => {
    return (
      formData.title.trim() !== '' &&
      formData.originalWork.trim() !== '' &&
      formData.cp.trim() !== '' &&
      formData.pages > 0 &&
      formData.price >= 0 &&
      fileUploaded &&
      isPagesChecked
    )
  }, [formData, fileUploaded, isPagesChecked])

  const missingRequired = useMemo(() => {
    const missing: string[] = []
    if (!formData.title.trim()) missing.push('作品标题')
    if (!formData.originalWork.trim()) missing.push('原作标签')
    if (!formData.cp.trim()) missing.push('CP')
    if (formData.pages <= 0) missing.push('页数')
    if (!fileUploaded) missing.push('文件上传')
    if (!isPagesChecked) missing.push('逐页检查')
    return missing
  }, [formData, fileUploaded, isPagesChecked])

  const handleInput = (key: keyof typeof formData, value: string | number | string[]) => {
    setFormData({ [key]: value } as any)
    if (isPagesChecked) {
      setPagesChecked(false)
    }
  }

  const handleFileTypeSelect = (type: WorkFileType) => {
    console.log('[PublishPage] Select file type:', type)
    if (uploadedFile && uploadedFile.type !== type) {
      setUploadedFile(null)
      setPreviewPages([])
      setPagesChecked(false)
    }
    chooseFileByType(type)
  }

  const chooseFileByType = (type: WorkFileType) => {
    console.log('[PublishPage] chooseFileByType:', type)

    if (type === 'long-image') {
      Taro.chooseImage({
        count: 9,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          console.log('[PublishPage] chooseImage success:', res.tempFiles.length, 'images')
          const totalSize = res.tempFiles.reduce((sum, f) => sum + f.size, 0)
          const firstPath = res.tempFiles[0].path
          const fileName = `长图_${res.tempFiles.length}张_${Date.now()}`

          Taro.showLoading({ title: '解析图片中...' })

          setTimeout(() => {
            const pages = generatePreviewPagesFromFile(firstPath, type, Math.max(24, res.tempFiles.length * 2))
            setUploadedFile({
              name: fileName,
              type,
              size: totalSize,
              tempFilePath: firstPath
            })
            setPreviewPages(pages)
            setPagesChecked(false)
            if (formData.pages <= 0) {
              setFormData({ pages: Math.max(24, res.tempFiles.length * 2) })
            }
            Taro.hideLoading()
            Taro.showToast({ title: '图片解析成功', icon: 'success' })
          }, 1200)
        },
        fail: (err) => {
          console.log('[PublishPage] chooseImage fail:', err)
        }
      })
    } else {
      const extensions = type === 'pdf' ? ['pdf'] : ['epub']
      Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: extensions,
        success: (res) => {
          const file = res.tempFiles[0]
          console.log('[PublishPage] chooseMessageFile success:', file.name, file.size)

          Taro.showLoading({ title: '解析文件中...' })

          setTimeout(() => {
            const pages = generatePreviewPagesFromFile(file.path, type, 32)
            setUploadedFile({
              name: file.name,
              type,
              size: file.size,
              tempFilePath: file.path
            })
            setPreviewPages(pages)
            setPagesChecked(false)
            if (formData.pages <= 0) {
              setFormData({ pages: 32 })
            }
            Taro.hideLoading()
            Taro.showToast({ title: '文件解析成功', icon: 'success' })
          }, 1500)
        },
        fail: (err) => {
          console.log('[PublishPage] chooseMessageFile fail:', err)
        }
      })
    }
  }

  const handleReupload = () => {
    if (fileType) {
      chooseFileByType(fileType)
    }
  }

  const handleCheckPages = () => {
    if (previewPages.length === 0) {
      Taro.showToast({ title: '请先上传文件', icon: 'none' })
      return
    }
    console.log('[PublishPage] Navigate to preview check')
    Taro.navigateTo({ url: '/pages/preview/index' })
  }

  const handleSaveDraft = () => {
    console.log('[PublishPage] Save draft:', formData.title)
    Taro.showToast({ title: '草稿已保存', icon: 'success' })
  }

  const handleSubmit = () => {
    if (missingRequired.length > 0) {
      Taro.showModal({
        title: '请先完善信息',
        content: `还需要完善：\n${missingRequired.join('、')}`,
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

    console.log('[PublishPage] Submit for review:', formData.title)
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
  }

  const getFileTypeLabel = (type: WorkFileType): string => {
    const opt = FILE_TYPE_OPTIONS.find((o) => o.type === type)
    return opt?.label || type
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
          <Text className={styles.label}>
            CP（角色配对）<Text className={styles.required}>*</Text>
          </Text>
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
            选择文件类型并上传<Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.fileTypeOptions}>
            {FILE_TYPE_OPTIONS.map((opt) => (
              <View
                key={opt.type}
                className={classnames(
                  styles.fileTypeOption,
                  fileType === opt.type && styles.fileTypeOptionActive
                )}
                onClick={() => handleFileTypeSelect(opt.type)}
              >
                <Text className={styles.fileTypeIcon}>{opt.icon}</Text>
                <Text className={styles.fileTypeLabel}>{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {!fileUploaded ? (
          <View className={styles.formGroup}>
            <View className={styles.uploadArea} onClick={() => {}}>
              <Text className={styles.uploadIcon}>☝️</Text>
              <Text className={styles.uploadText}>请先选择文件类型</Text>
              <Text className={styles.uploadHint}>支持 PDF / 长图 / ePub，最大 100MB</Text>
            </View>
          </View>
        ) : (
          <View className={styles.formGroup}>
            <View className={styles.uploadSuccess} onClick={handleReupload}>
              <View className={styles.uploadSuccessLeft}>
                <Text className={styles.uploadSuccessIcon}>
                  {fileType === 'pdf' ? '📄' : fileType === 'long-image' ? '🖼️' : '📱'}
                </Text>
                <View className={styles.uploadSuccessInfo}>
                  <Text className={styles.uploadFileName}>{uploadedFile!.name}</Text>
                  <Text className={styles.uploadFileMeta}>
                    {getFileTypeLabel(uploadedFile!.type)} · {formatFileSize(uploadedFile!.size)}
                  </Text>
                </View>
              </View>
              <Text className={styles.uploadSuccessRight}>点击重新上传</Text>
            </View>
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
                CP：{formData.cp || '未填写'}{'\n'}
                分级：{RATING_LABELS[formData.rating]}{'\n'}
                共 {formData.pages} 页 · {formatPrice(formData.price)}
              </Text>
            </View>
          </View>

          <View className={styles.previewPagesTitle}>
            试读预览（前{previewPages.length}页）
            <Text className={styles.previewPagesHint}>请确认内容无误</Text>
          </View>

          <ScrollView className={styles.previewPagesList} scrollX>
            {previewPages.map((page) => (
              <View key={page.index} className={styles.previewPageItem}>
                <PagePreview page={page} compact />
              </View>
            ))}
          </ScrollView>

          {pagesWithIssues.length > 0 && (
            <View className={styles.issueSummaryBar}>
              <Text className={styles.issueSummaryText}>
                ⚠️ 已标记 {pagesWithIssues.length} 页存在问题
              </Text>
            </View>
          )}

          <View
            className={classnames(
              styles.pageCheckBtn,
              isPagesChecked && styles.pageCheckBtnDone
            )}
            onClick={handleCheckPages}
          >
            {isPagesChecked ? '✓ 已完成逐页检查' : '逐页检查（缺页/糊字/方向）'}
          </View>

          {!isPagesChecked && (
            <Text className={styles.checkHint}>提交前请先完成逐页检查</Text>
          )}
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
