import React from 'react'
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface GroupMembersTabProps {
  members: Member[]
}

const GroupMembersTab: React.FC<GroupMembersTabProps> = ({ members }) => {
  return (
    <Card>
      <CardContent>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{`${member.firstName} ${member.lastName}`}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Chip label={member.role} color={member.role === 'admin' ? 'error' : 'info'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default GroupMembersTab
