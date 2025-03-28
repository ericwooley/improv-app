import React, { ReactNode } from 'react'

interface InfoItemProps {
  icon: string
  children: ReactNode
  className?: string
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, children, className = 'mb-3' }) => {
  return (
    <div className={`is-flex is-align-items-center ${className}`}>
      <span className="icon has-text-info mr-2">
        <i className={icon}></i>
      </span>
      <span>{children}</span>
    </div>
  )
}

export default InfoItem
