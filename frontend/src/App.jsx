import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App(){
  return (
    <BrowserRouter>
      <div style={{padding:20}}>
        <header style={{marginBottom:20}}>
          <h1>Smart Furniture Assistant</h1>
          <nav>
            <Link to="/">Chat</Link> | {' '}
            <Link to="/analytics">Analytics</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<ChatPage/>} />
          <Route path="/analytics" element={<AnalyticsPage/>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}