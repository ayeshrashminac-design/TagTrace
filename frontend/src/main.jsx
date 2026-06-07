import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Finder from './Finder.jsx'
import './index.css' // Tailwind වැඩ කරන්න මේක අනිවාර්යයෙන්ම ඕනේ

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* URL: http://localhost:5173/ -> Shows Owner Dashboard */}
        <Route path="/" element={<App />} />
        
        {/* URL: http://localhost:5173/track/:id -> Shows Finder Tracking Page */}
        <Route path="/track/:id" element={<Finder />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)