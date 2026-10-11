import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register offline service worker for standalone offline execution
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // offline fallback
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

