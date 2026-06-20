import { FeedbackItem, WorkStats } from '@/types'

export const mockFeedback: FeedbackItem[] = [
  {
    id: 'f1',
    workId: '1000',
    workTitle: '夏日祭的约定',
    type: 'comment',
    content: '画风太可爱了！剧情也很温馨，反复看了好多遍~',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    userName: '小樱花'
  },
  {
    id: 'f2',
    workId: '1000',
    workTitle: '夏日祭的约定',
    type: 'typo',
    content: '第8页第3行"约定"写成了"约的"',
    pageNumber: 8,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    userName: '校对小能手'
  },
  {
    id: 'f3',
    workId: '1002',
    workTitle: '花与剑',
    type: 'comment',
    content: '这个CP太好磕了！太太画得也太好了吧！',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    userName: 'CP脑晚期'
  },
  {
    id: 'f4',
    workId: '1004',
    workTitle: '逆光而行',
    type: 'comment',
    content: '氛围渲染绝了，太太的分镜真的很有电影感！',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    userName: '路人甲'
  },
  {
    id: 'f5',
    workId: '1000',
    workTitle: '夏日祭的约定',
    type: 'comment',
    content: '漫展现场买了实体本，现在电子版也入手收藏~',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    userName: '双版本收集党'
  },
  {
    id: 'f6',
    workId: '1002',
    workTitle: '花与剑',
    type: 'typo',
    content: '第15页对话框有个字显示不全',
    pageNumber: 15,
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    userName: '火眼金睛'
  },
  {
    id: 'f7',
    workId: '1006',
    workTitle: '海潮之声',
    type: 'comment',
    content: '期待很久了！终于等到电子版！',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    userName: '蹲更选手'
  }
]

export const mockWorkStats: WorkStats[] = [
  {
    workId: '1000',
    workTitle: '夏日祭的约定',
    purchaseCount: 328,
    favoriteCount: 156,
    commentCount: 42,
    typoCount: 2
  },
  {
    workId: '1002',
    workTitle: '花与剑',
    purchaseCount: 215,
    favoriteCount: 98,
    commentCount: 28,
    typoCount: 1
  },
  {
    workId: '1004',
    workTitle: '逆光而行',
    purchaseCount: 412,
    favoriteCount: 203,
    commentCount: 65,
    typoCount: 0
  },
  {
    workId: '1006',
    workTitle: '海潮之声',
    purchaseCount: 89,
    favoriteCount: 45,
    commentCount: 12,
    typoCount: 0
  }
]

export default mockFeedback
