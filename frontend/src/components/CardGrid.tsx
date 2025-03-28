import React, { ReactNode } from 'react'

interface CardGridProps {
  children: ReactNode
}

const CardGrid: React.FC<CardGridProps> = ({ children }) => {
  return <div className="columns is-multiline">{children}</div>
}

export default CardGrid
