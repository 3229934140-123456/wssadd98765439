export type WorkStatus = 'draft' | 'reviewing' | 'published' | 'rejected' | 'offline'

export type ReviewStage = 'submitted' | 'reviewing' | 'need-fix' | 'passed'

export type WorkFileType = 'pdf' | 'long-image' | 'epub'

export type RatingLevel = 'G' | 'PG' | 'R15' | 'R18'

export interface WorkCP {
  name: string
  role?: string
}

export interface WorkPage {
  index: number
  url: string
  width: number
  height: number
  issues?: ('missing' | 'blurry' | 'wrong-direction')[]
}

export interface DailyTrendPoint {
  date: string
  views: number
  purchases: number
  favorites: number
  previewClicks: number
}

export interface WorkStats {
  viewCount: number
  favoriteCount: number
  purchaseCount: number
  previewClickCount: number
  trend: DailyTrendPoint[]
}

export interface UploadedFileSnapshot {
  name: string
  type: WorkFileType
  size: number
  tempFilePath: string
  fingerprint: string
}

export interface WorkPublishSnapshot {
  formData: PublishFormData
  uploadedFile: UploadedFileSnapshot | null
  previewPages: WorkPage[]
  isPagesChecked: boolean
}

export interface Work {
  id: string
  title: string
  originalWork: string
  tags: string[]
  cp: WorkCP[]
  rating: RatingLevel
  pages: number
  price: number
  coverUrl: string
  fileType: WorkFileType
  status: WorkStatus
  previewPages: WorkPage[]
  createdAt: string
  submittedAt?: string
  publishedAt?: string
  purchaseCount: number
  favoriteCount: number
  rejectReason?: string
  reviewStage?: ReviewStage
  reviewUpdatedAt?: string
  publishSnapshot?: WorkPublishSnapshot
  stats: WorkStats
}

export type ReminderType =
  | 'presale-upcoming'
  | 'unlock-upcoming'
  | 'discount-ending'
  | 'offline-upcoming'

export interface ScheduleReminder {
  id: string
  workId: string
  workTitle: string
  scheduleId: string
  type: ReminderType
  title: string
  description: string
  dueDate: string
  completed: boolean
  completedAt?: string
  createdAt: string
}

export interface ScheduleNode {
  id: string
  workId: string
  workTitle: string
  type: 'presale' | 'unlock' | 'discount' | 'offline'
  date: string
  time: string
  completed: boolean
  extraInfo?: Record<string, any>
}

export interface FeedbackItem {
  id: string
  workId: string
  workTitle: string
  type: 'comment' | 'typo'
  content: string
  pageNumber?: number
  createdAt: string
  userName: string
}

export interface WorkStatsSummary {
  workId: string
  workTitle: string
  purchaseCount: number
  favoriteCount: number
  commentCount: number
  typoCount: number
}

export interface PublishFormData {
  title: string
  originalWork: string
  tags: string[]
  cp: string
  rating: RatingLevel
  pages: number
  price: number
  fileUrl?: string
  fileType?: WorkFileType
}

export type ScheduleType = 'presale' | 'unlock' | 'discount' | 'offline'

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  presale: '预售开始',
  unlock: '正式解锁',
  discount: '限时折扣',
  offline: '下架时间'
}

export const SCHEDULE_TYPE_COLORS: Record<ScheduleType, string> = {
  presale: '#6366F1',
  unlock: '#10B981',
  discount: '#F59E0B',
  offline: '#EF4444'
}

export const RATING_LABELS: Record<RatingLevel, string> = {
  G: '全年龄向',
  PG: '保护级',
  R15: '限制15+',
  R18: '限制18+'
}

export const STATUS_LABELS: Record<WorkStatus, string> = {
  draft: '草稿',
  reviewing: '审核中',
  published: '已发布',
  rejected: '已驳回',
  offline: '已下架'
}

export const STATUS_COLORS: Record<WorkStatus, string> = {
  draft: '#9CA3AF',
  reviewing: '#F59E0B',
  published: '#10B981',
  rejected: '#EF4444',
  offline: '#6B7280'
}

export const REVIEW_STAGE_LABELS: Record<ReviewStage, string> = {
  submitted: '已提交',
  reviewing: '审核中',
  'need-fix': '需要修改',
  passed: '审核通过'
}

export const REVIEW_STAGE_COLORS: Record<ReviewStage, string> = {
  submitted: '#6366F1',
  reviewing: '#F59E0B',
  'need-fix': '#EF4444',
  passed: '#10B981'
}

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  'presale-upcoming': '预售即将开始',
  'unlock-upcoming': '正式解锁将至',
  'discount-ending': '折扣活动即将结束',
  'offline-upcoming': '即将下架'
}

export const REMINDER_TYPE_COLORS: Record<ReminderType, string> = {
  'presale-upcoming': '#6366F1',
  'unlock-upcoming': '#10B981',
  'discount-ending': '#F59E0B',
  'offline-upcoming': '#EF4444'
}
