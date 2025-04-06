import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material'
import { useSubmitRSVPMutation } from '../../store/api/eventsApi'

interface RSVPModalProps {
  open: boolean
  onClose: () => void
  eventId: string
  initialStatus?: string
}

const RSVPModal = ({ open, onClose, eventId, initialStatus }: RSVPModalProps) => {
  const [status, setStatus] = useState<string>(initialStatus || 'attending')
  const [submitRSVP, { isLoading }] = useSubmitRSVPMutation()

  const handleSubmit = async () => {
    try {
      await submitRSVP({
        eventId,
        status: status as 'attending' | 'maybe' | 'declined',
      }).unwrap()
      onClose()
    } catch (error) {
      console.error('Failed to submit RSVP:', error)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>RSVP to Event</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>Please select your attendance status:</Typography>
        <Box sx={{ mt: 2 }}>
          <FormControl component="fieldset">
            <RadioGroup value={status} onChange={(e) => setStatus(e.target.value)}>
              <FormControlLabel value="attending" control={<Radio />} label="I'll be there! (Attending)" />
              <FormControlLabel value="maybe" control={<Radio />} label="I might come (Maybe)" />
              <FormControlLabel value="declined" control={<Radio />} label="I can't make it (Declined)" />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RSVPModal
