import React from 'react'
import { Card, CardContent, Stack, Typography } from '@mui/material'
import { CalendarMonth as CalendarIcon, Security as SecurityIcon } from '@mui/icons-material'
import { InfoItem, formatDate } from '..'

interface GroupInfoTabProps {
  group: {
    Name: string
    Description: string
    CreatedAt: string
  }
  userRole: string
}

const GroupInfoTab: React.FC<GroupInfoTabProps> = ({ group, userRole }) => {
  return (
    <Card sx={{ mt: 0, pt: 0 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="body1">{group.Description}</Typography>
          <InfoItem icon={<CalendarIcon />}>Created {formatDate(new Date(group.CreatedAt))}</InfoItem>
          <InfoItem icon={<SecurityIcon />}>Your Role: {userRole}</InfoItem>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default GroupInfoTab
