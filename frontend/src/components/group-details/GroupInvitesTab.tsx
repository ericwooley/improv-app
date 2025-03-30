import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Grid,
  Alert,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { ContentCopy as CopyIcon, Add as AddIcon } from '@mui/icons-material'
import dayjs, { Dayjs } from 'dayjs'
type InviteLink = {
  id: string
  description: string
  code: string
  expiresAt: string
  active: boolean
  createdBy: string
  createdAt: string
}

type GroupInvitesTabProps = {
  groupId: string
  userRole: string
  inviteLinks: InviteLink[]
  onCreateInviteLink: (description: string, expiresAt: string) => void
  onUpdateInviteLinkStatus: (linkId: string, active: boolean) => void
}

const GroupInvitesTab = ({
  userRole,
  inviteLinks,
  onCreateInviteLink,
  onUpdateInviteLinkStatus,
}: GroupInvitesTabProps) => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState<Dayjs>(dayjs().add(7, 'day'))
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  const isAdminOrOrganizer = userRole === 'admin' || userRole === 'organizer'

  const handleCreateDialogOpen = () => {
    setOpenCreateDialog(true)
  }

  const handleCreateDialogClose = () => {
    setOpenCreateDialog(false)
    setDescription('')
    setExpiresAt(dayjs().add(7, 'day'))
  }

  const handleCreateInviteLink = () => {
    if (description && expiresAt) {
      onCreateInviteLink(description, expiresAt.toISOString())
      handleCreateDialogClose()
    }
  }

  const handleCopyLink = (code: string, linkId: string) => {
    const inviteLink = `${window.location.origin}/join/${code}`
    navigator.clipboard.writeText(inviteLink)
    setCopiedLinkId(linkId)
    setTimeout(() => setCopiedLinkId(null), 3000)
  }

  const handleToggleActive = (linkId: string, currentActive: boolean) => {
    onUpdateInviteLinkStatus(linkId, !currentActive)
  }

  const isExpired = (expiresAt: string) => {
    const expiryDate = dayjs(expiresAt)
    return expiryDate.isBefore(dayjs())
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Invite Links</Typography>
            {isAdminOrOrganizer && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateDialogOpen}>
                Create Invite Link
              </Button>
            )}
          </Box>

          {!isAdminOrOrganizer && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Only admins and organizers can manage invite links.
            </Alert>
          )}

          {inviteLinks.length === 0 ? (
            <Typography variant="body1" sx={{ mt: 2 }}>
              No invite links have been created yet.
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Invite Link</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inviteLinks.map((link) => {
                    const expired = isExpired(link.expiresAt)
                    const inviteUrl = `${window.location.origin}/join/${link.code}`

                    return (
                      <TableRow key={link.id}>
                        <TableCell>{link.description}</TableCell>
                        <TableCell sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inviteUrl}
                          <IconButton size="small" onClick={() => handleCopyLink(link.code, link.id)} sx={{ ml: 1 }}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                          {copiedLinkId === link.id && (
                            <Chip label="Copied!" size="small" color="success" sx={{ ml: 1 }} />
                          )}
                        </TableCell>
                        <TableCell>{dayjs(link.expiresAt).diff(dayjs(), 'day')} days</TableCell>
                        <TableCell>
                          {expired ? (
                            <Chip label="Expired" color="error" size="small" />
                          ) : link.active ? (
                            <Chip label="Active" color="success" size="small" />
                          ) : (
                            <Chip label="Inactive" color="default" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {isAdminOrOrganizer && !expired && (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={link.active}
                                  onChange={() => handleToggleActive(link.id, link.active)}
                                  disabled={expired}
                                />
                              }
                              label={link.active ? 'Active' : 'Inactive'}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>

      {/* Create Invite Link Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Invite Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="description"
            label="Description"
            placeholder="Discord community invite"
            type="text"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            helperText="Add a description to help you remember what this link is for"
            required
            sx={{ mb: 3, mt: 1 }}
          />

          <DateTimePicker
            label="Expiration Date"
            value={expiresAt}
            onChange={(newValue) => setExpiresAt(newValue || dayjs())}
            slotProps={{
              textField: {
                fullWidth: true,
                helperText: 'When this link will expire',
              },
            }}
            minDateTime={dayjs()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button onClick={handleCreateInviteLink} variant="contained" disabled={!description || !expiresAt}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default GroupInvitesTab
