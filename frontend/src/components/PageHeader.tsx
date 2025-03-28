import React, { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="is-flex is-flex-direction-column-mobile is-justify-content-space-between is-align-items-start-mobile mb-5">
      <div className="mb-4-mobile">
        <h1 className="title is-2">{title}</h1>
        {subtitle && <p className="subtitle is-5">{subtitle}</p>}
      </div>
      {actions && <div className="mt-4 mt-0-tablet">{actions}</div>}
    </div>
  )
}

export default PageHeader
