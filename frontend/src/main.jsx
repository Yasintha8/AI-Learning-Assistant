import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position='top-right'
          toastOptions={{
            duration: 3000,
            style: {
              background: '',
              color: '#333',
            }
          }}
        />
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
