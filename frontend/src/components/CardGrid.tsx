import React, { ReactNode } from 'react'
import { Grid } from '@mui/material'

interface CardGridProps {
  children: ReactNode
}

const CardGrid: React.FC<CardGridProps> = ({ children }) => {
  return (
    <Grid container spacing={2}>
      {React.Children.map(children, (child) => (
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 3,
            xl: 2,
          }}
          key={Math.random()}>
          {child}
        </Grid>
      ))}
    </Grid>
  )
}

export default CardGrid
