import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ItemCardProps {
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  footerLink?: string
  footerLinkText?: string
  id?: string
}

const ItemCard: React.FC<ItemCardProps> = ({
  title,
  description,
  children,
  footer,
  footerLink,
  footerLinkText = 'View Details',
  id,
}) => {
  return (
    <div className="card h-100" data-id={id}>
      <div className="card-content">
        <h2 className="title">{title}</h2>
        {description && <p className="subtitle has-text-grey mb-4">{description}</p>}
        {children}
      </div>

      {(footer || footerLink) && (
        <div className="card-footer">
          {footer}

          {footerLink && (
            <Link to={footerLink} className="card-footer-item is-flex is-justify-content-space-between">
              <span>{footerLinkText}</span>
              <span className="icon">
                <i className="fas fa-arrow-right"></i>
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default ItemCard
