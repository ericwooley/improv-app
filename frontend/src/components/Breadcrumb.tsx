import React from 'react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  to?: string
  active?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: 'arrow' | 'bullet' | 'dot' | 'succeeds'
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, separator = 'arrow' }) => {
  return (
    <nav className={`breadcrumb has-${separator}-separator mb-5`} aria-label="breadcrumbs">
      <ul>
        {items.map((item, index) => (
          <li key={index} className={item.active ? 'is-active' : ''}>
            {item.active ? (
              <a href="#" aria-current="page">
                {item.label}
              </a>
            ) : item.to ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Breadcrumb
