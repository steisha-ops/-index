import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, LogOut, Settings, Home, Newspaper, Upload, Save, Edit2, Trash2, Plus } from 'lucide-react'
import AdminPanel from './pages/AdminPanel'
import AuthorCabinet from './pages/AuthorCabinet'
import LoginPage from './pages/LoginPage'

export default function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Проверяем сохраненную сессию при загрузке
        const savedUser = localStorage.getItem('author_user')
        if (savedUser) {
            setUser(JSON.parse(savedUser))
        }
        setLoading(false)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                />
            </div>
        )
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={
                    user ? (user.role === 'admin' ? <AdminPanel user={user} setUser={setUser} /> : <AuthorCabinet user={user} setUser={setUser} />) : <LoginPage setUser={setUser} />
                } />
            </Routes>
        </BrowserRouter>
    )
}
