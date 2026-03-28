import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { OrderProvider } from './contexts/OrderContext.jsx'
import './index.css'

// Force service worker update on every load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.update());
  });
}

// Apply saved theme before render
const savedDark = localStorage.getItem('darkMode');
if (savedDark === 'false') {
    document.body.classList.add('light');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <OrderProvider>
      <App />
    </OrderProvider>
  </React.StrictMode>,
)
