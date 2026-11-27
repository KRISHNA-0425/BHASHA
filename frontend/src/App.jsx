import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Homepage from './pages/Homepage.jsx'
import Payment from './pages/Payment.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import NotFound from './pages/NotFound.jsx'

import { currentUser } from './features/currentUser'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData, clearUserData } from './redux/userSlice.js'
import Project from './pages/Project.jsx'

const App = () => {
  const dispatch = useDispatch()
  const { userData } = useSelector((state) => state.user)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await currentUser()
        if (data) {
          dispatch(setUserData(data))
        } else {
          dispatch(clearUserData())
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error)
        dispatch(clearUserData())
      } finally {
        setIsCheckingAuth(false)
      }
    }

    fetchCurrentUser()
  }, [dispatch])

  const isLandingRoute = window.location.pathname === '/' || window.location.pathname === '/landing'

  if (isCheckingAuth && !isLandingRoute) {
    return (
      <div className="min-h-screen w-full bg-[#07090e] flex items-center justify-center text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
          <span className="text-xs font-mono tracking-widest uppercase text-slate-500">Checking Session...</span>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={userData ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/register" element={userData ? <Navigate to="/home" replace /> : <Register />} />
      <Route path="/home" element={userData ? <Homepage /> : <Navigate to="/login" replace />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path='/project/:id' element={userData ? <Project /> : <Navigate to='/login' replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App