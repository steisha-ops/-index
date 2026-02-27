import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { 
    getClientIP, 
    isIPBlocked, 
    getRemainingAttempts, 
    recordLoginAttempt,
    hashPassword 
} from '../lib/security'
import { getAuthors } from '../lib/api'

export default function LoginPage({ setUser }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('author')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [blocked, setBlocked] = useState(false)
    const [remainingMinutes, setRemainingMinutes] = useState(0)
    const [remainingAttempts, setRemainingAttempts] = useState(5)
    const [authors, setAuthors] = useState([])

    // Загрузка авторов и проверка блокировки при загрузке
    useEffect(() => {
        const loadData = async () => {
            // Загружаем авторов из хранилища/API
            try {
                const data = await getAuthors()
                setAuthors(data)
            } catch (err) {
                console.error('Failed to load authors:', err)
            }
        }
        loadData()

        const identifier = getClientIP()
        const blockStatus = isIPBlocked(identifier)
        if (blockStatus.blocked) {
            setBlocked(true)
            setRemainingMinutes(blockStatus.remainingMinutes)
        }
        setRemainingAttempts(getRemainingAttempts(identifier))
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const identifier = getClientIP()
            
            // Проверка блокировки
            const blockStatus = isIPBlocked(identifier)
            if (blockStatus.blocked) {
                setBlocked(true)
                setRemainingMinutes(blockStatus.remainingMinutes)
                setError(`Слишком много неудачных попыток. Повторите попытку через ${blockStatus.remainingMinutes} минут`)
                setLoading(false)
                return
            }

            // Валидация полей
            if (!email || !password) {
                setError('Заполните все поля')
                recordLoginAttempt(identifier, false)
                setRemainingAttempts(getRemainingAttempts(identifier))
                setLoading(false)
                return
            }

            // Авторизация
            let success = false
            let userData = null

            if (role === 'admin' && email === 'admin@index.dev' && password === 'admin123') {
                // Admin login
                userData = { 
                    role: 'admin', 
                    email, 
                    name: 'Администратор',
                    id: 'admin_001',
                    passwordHash: hashPassword(password)
                }
                success = true
            } else if (role === 'author') {
                // Author login - check against loaded authors
                const author = authors.find(a => a.email === email)
                if (author && password === 'author123') { // Demo: all authors = 'author123'
                    userData = {
                        role: 'author',
                        email,
                        name: author.name,
                        id: author.id,
                        passwordHash: hashPassword(password),
                        avatar: author.avatar || null,
                        bio: author.bio || ''
                    }
                    success = true
                } else {
                    setError('Автор не найден или пароль неверный')
                    recordLoginAttempt(identifier, false)
                    setRemainingAttempts(getRemainingAttempts(identifier))
                    setLoading(false)
                    return
                }
            } else {
                setError('Неверный email или пароль')
                recordLoginAttempt(identifier, false)
                setRemainingAttempts(getRemainingAttempts(identifier))
                setLoading(false)
                return
            }

            if (success && userData) {
                // Успешный вход
                recordLoginAttempt(identifier, true)
                localStorage.setItem('author_user', JSON.stringify(userData))
                setUser(userData)
            }
        } catch (err) {
            setError('Ошибка при входе')
            const identifier = getClientIP()
            recordLoginAttempt(identifier, false)
            setRemainingAttempts(getRemainingAttempts(identifier))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="flex justify-center mb-4"
                    >
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                            <Shield size={32} className="text-white" />
                        </div>
                    </motion.div>
                    <h1 className="text-3xl font-black text-white mb-2">Index Oblav</h1>
                    <p className="text-gray-400">Кабинет авторов и администратора</p>
                </div>

                {/* Blocked Alert */}
                {blocked && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-semibold mb-6 flex items-center gap-3"
                    >
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <div>
                            Аккаунт заблокирован на {remainingMinutes} мин из-за множественных неудачных попыток входа.
                        </div>
                    </motion.div>
                )}

                {/* Role Selector */}
                <div className="flex gap-3 mb-8">
                    {[
                        { id: 'author', label: 'Автор', icon: User },
                        { id: 'admin', label: 'Админ', icon: Shield }
                    ].map(r => {
                        const Icon = r.icon
                        return (
                            <motion.button
                                key={r.id}
                                onClick={() => setRole(r.id)}
                                disabled={blocked}
                                whileTap={{ scale: 0.95 }}
                                className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                                    role === r.id
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                                        : 'glass-card text-gray-400 hover:text-gray-200'
                                } ${blocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Icon size={18} />
                                {r.label}
                            </motion.button>
                        )
                    })}
                </div>

                {/* Login Form */}
                <motion.form
                    onSubmit={handleLogin}
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                        <motion.input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={blocked}
                            placeholder={role === 'admin' ? 'admin@index.dev' : 'your@email.com'}
                            className="w-full px-4 py-3 rounded-xl glass-card bg-slate-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            whileFocus={{ scale: 1.02 }}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Пароль</label>
                        <motion.input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={blocked}
                            placeholder={role === 'admin' ? 'admin123' : 'минимум 6 символов'}
                            className="w-full px-4 py-3 rounded-xl glass-card bg-slate-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            whileFocus={{ scale: 1.02 }}
                        />
                    </div>

                    {/* Attempts Warning */}
                    {!blocked && remainingAttempts < 5 && remainingAttempts > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 text-sm font-semibold flex items-center gap-2"
                        >
                            <AlertCircle size={16} />
                            Осталось попыток: <span className="font-black text-lg">{remainingAttempts}</span>/5
                        </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-medium flex items-center gap-2"
                        >
                            <AlertCircle size={16} className="flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Submit */}
                    <motion.button
                        type="submit"
                        disabled={loading || blocked}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 disabled:opacity-50 transition flex items-center justify-center gap-2"
                    >
                        <Lock size={18} />
                        {loading ? 'Вход...' : blocked ? 'Заблокирован' : 'Войти'}
                    </motion.button>
                </motion.form>

                {/* Footer */}
                <div className="mt-6 text-center space-y-3">
                    <p className="text-gray-500 text-xs">
                        🔒 <span className="text-green-400 font-semibold">Безопасная аутентификация</span>
                    </p>
                    <div className="text-xs text-gray-600 space-y-1">
                        <p>Администратор: <code className="bg-slate-800/50 px-2 py-1 rounded text-gray-300">admin@index.dev / admin123</code></p>
                        <p>Авторов загружено: <span className="text-blue-300 font-semibold">{authors.length}</span></p>
                        {authors.length > 0 && (
                            <div className="mt-2 p-2 bg-slate-800/30 rounded text-gray-400">
                                <p className="text-xs font-semibold mb-1">Доступные авторы:</p>
                                {authors.slice(0, 3).map((a, i) => (
                                    <p key={i} className="text-xs">
                                        <span className="text-purple-300">{a.email}</span> / <span className="text-gray-400">author123</span>
                                    </p>
                                ))}
                                {authors.length > 3 && <p className="text-xs text-gray-500">... и еще {authors.length - 3}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
