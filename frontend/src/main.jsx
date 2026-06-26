import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
  </StrictMode>,
)
