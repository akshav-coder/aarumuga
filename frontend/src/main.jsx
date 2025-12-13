import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { store } from './store/store';
import theme from './theme/theme';
import { ToastProvider } from './components/common/ToastProvider';
import { LanguageProvider } from './contexts/LanguageContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LanguageProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
