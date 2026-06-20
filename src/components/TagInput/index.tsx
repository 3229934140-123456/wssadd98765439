import React, { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder = '输入标签后回车添加' }) => {
  const [inputValue, setInputValue] = useState('')

  const handleConfirm = () => {
    const value = inputValue.trim()
    if (value && !tags.includes(value)) {
      onChange([...tags, value])
      setInputValue('')
    }
  }

  const handleRemove = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove))
  }

  return (
    <View className={styles.wrapper}>
      <View className={styles.tagList}>
        {tags.map((tag) => (
          <View key={tag} className={styles.tag}>
            <Text className={styles.tagText}>{tag}</Text>
            <Text
              className={styles.removeBtn}
              onClick={() => handleRemove(tag)}
            >
              ×
            </Text>
          </View>
        ))}
        <Input
          className={classnames(styles.input, tags.length > 0 && styles.inputWithTags)}
          value={inputValue}
          placeholder={placeholder}
          placeholderClass={styles.placeholder}
          onInput={(e) => setInputValue(e.detail.value)}
          onConfirm={handleConfirm}
          confirmType="done"
        />
      </View>
    </View>
  )
}

export default TagInput
