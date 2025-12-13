import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function Modal({ open, onClose, title, children, onSubmit, submitText = 'Save' }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1.5,
        background: '#667eea',
        color: 'white',
        fontWeight: 600,
        fontSize: '1.5rem',
        px: 3,
        py: 2,
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {title}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: 'white',
              fontSize: '1.5rem',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
        {children}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ minWidth: 120, fontSize: '1.125rem', py: 1.5 }}
        >
          Cancel
        </Button>
        {onSubmit && (
          <Button 
            onClick={onSubmit} 
            variant="contained"
            sx={{ minWidth: 120, fontSize: '1.125rem', py: 1.5 }}
          >
            {submitText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default Modal;

