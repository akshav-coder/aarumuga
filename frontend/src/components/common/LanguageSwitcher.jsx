import { useState } from 'react';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/translations';

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Change Language">
        <IconButton
          onClick={handleClick}
          sx={{ color: 'white' }}
          size="small"
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          selected={language === 'en'}
          onClick={() => handleLanguageChange('en')}
        >
          English
        </MenuItem>
        <MenuItem
          selected={language === 'ta'}
          onClick={() => handleLanguageChange('ta')}
        >
          தமிழ் (Tamil)
        </MenuItem>
      </Menu>
    </>
  );
}

export default LanguageSwitcher;

