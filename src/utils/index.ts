export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(2)}`
}

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate()
}

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay()
}

export const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export const isToday = (dateStr: string): boolean => {
  return isSameDay(dateStr, new Date().toISOString())
}
