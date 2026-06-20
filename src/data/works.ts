import { Work, RatingLevel, WorkStatus } from '@/types'

const coverIds = [103, 119, 220, 225, 230, 250, 1080, 431, 570, 326]

const ratings: RatingLevel[] = ['G', 'PG', 'R15', 'R18']
const statuses: WorkStatus[] = ['draft', 'reviewing', 'published', 'rejected', 'published']

const titles = [
  '夏日祭的约定',
  '星尘之诗',
  '花与剑',
  '迷途之歌',
  '逆光而行',
  '月下誓约',
  '海潮之声',
  '云端漫步',
  '时光缝隙',
  '彩虹彼端'
]

const originalWorks = [
  '原神',
  '魔道祖师',
  '全职高手',
  '进击的巨人',
  '鬼灭之刃',
  '咒术回战',
  '文豪野犬',
  '排球少年',
  '东京卍复仇者',
  '刀剑乱舞'
]

const generatePreviewPages = (workId: string, count: number) => {
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    index: i + 1,
    url: `https://picsum.photos/id/${(parseInt(workId) + i * 7) % 100}/600/800`,
    width: 600,
    height: 800,
    issues: [] as ('missing' | 'blurry' | 'wrong-direction')[]
  }))
}

export const mockWorks: Work[] = Array.from({ length: 8 }, (_, i) => {
  const id = String(1000 + i)
  return {
    id,
    title: titles[i % titles.length],
    originalWork: originalWorks[i % originalWorks.length],
    tags: ['同人本', '全彩', i % 2 === 0 ? '短篇' : '长篇'],
    cp: [{ name: i % 2 === 0 ? '主角A×主角B' : '角色X×角色Y' }],
    rating: ratings[i % ratings.length],
    pages: 24 + i * 8,
    price: [15, 20, 25, 30, 35, 40][i % 6],
    coverUrl: `https://picsum.photos/id/${coverIds[i % coverIds.length]}/400/560`,
    fileType: i % 3 === 0 ? 'pdf' : i % 3 === 1 ? 'long-image' : 'epub',
    status: statuses[i % statuses.length],
    previewPages: generatePreviewPages(id, 24 + i * 8),
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    submittedAt: i > 1 ? new Date(Date.now() - i * 86400000 * 2).toISOString() : undefined,
    publishedAt: statuses[i % statuses.length] === 'published' ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
    purchaseCount: Math.floor(Math.random() * 500),
    favoriteCount: Math.floor(Math.random() * 200),
    rejectReason: statuses[i % statuses.length] === 'rejected' ? '封面图片格式不符合要求，请重新上传' : undefined,
    stats: {
      viewCount: 0,
      favoriteCount: 0,
      purchaseCount: 0,
      previewClickCount: 0,
      trend: []
    },
    reviewTimeline: []
  }
})

export default mockWorks
