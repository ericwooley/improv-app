/**
 * Utility functions for formatting dates and times
 */

export const formatDate = (dateStr: string | Date): string => {
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatTime = (dateStr: string | Date): string => {
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
