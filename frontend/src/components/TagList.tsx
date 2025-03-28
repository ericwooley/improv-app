import React from 'react'

interface TagListProps {
  tags: string[]
  variant?: 'info' | 'primary' | 'success' | 'warning' | 'danger'
  light?: boolean
  className?: string
}

const TagList: React.FC<TagListProps> = ({ tags, variant = 'info', light = true, className = 'mb-4' }) => {
  if (!tags || tags.length === 0) return null

  return (
    <div className={`tags ${className}`}>
      {tags.map((tag, index) => (
        <span key={index} className={`tag is-${variant}${light ? ' is-light' : ''}`}>
          {tag}
        </span>
      ))}
    </div>
  )
}

export default TagList
