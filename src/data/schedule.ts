import { ScheduleNode } from '@/types'

const generateDate = (daysOffset: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString()
}

export const mockScheduleNodes: ScheduleNode[] = [
  {
    id: 's1',
    workId: '1002',
    workTitle: '花与剑',
    type: 'presale',
    date: generateDate(3),
    time: '10:00',
    completed: false
  },
  {
    id: 's2',
    workId: '1002',
    workTitle: '花与剑',
    type: 'unlock',
    date: generateDate(10),
    time: '00:00',
    completed: false
  },
  {
    id: 's3',
    workId: '1002',
    workTitle: '花与剑',
    type: 'discount',
    date: generateDate(10),
    time: '00:00',
    completed: false,
    extraInfo: { discountRate: 0.8, duration: 3 }
  },
  {
    id: 's4',
    workId: '1004',
    workTitle: '逆光而行',
    type: 'presale',
    date: generateDate(-2),
    time: '12:00',
    completed: true
  },
  {
    id: 's5',
    workId: '1004',
    workTitle: '逆光而行',
    type: 'unlock',
    date: generateDate(5),
    time: '20:00',
    completed: false
  },
  {
    id: 's6',
    workId: '1006',
    workTitle: '海潮之声',
    type: 'offline',
    date: generateDate(30),
    time: '23:59',
    completed: false
  },
  {
    id: 's7',
    workId: '1000',
    workTitle: '夏日祭的约定',
    type: 'unlock',
    date: generateDate(-5),
    time: '00:00',
    completed: true
  }
]

export default mockScheduleNodes
