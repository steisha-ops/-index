import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Plus, Trash2, Copy, Eye, EyeOff, Edit2, Save, X, RefreshCw } from 'lucide-react'
import { hashPassword } from '../lib/security'
import { getAuthors, saveAuthors } from '../lib/api'

export default function AdminPanel({ user, setUser }) {
    const [authors, setAuthors] = useState([])
    const [loading, setLoading] = useState(true)
    const [showNewAuthor, setShowNewAuthor] = useState(false)
    const [newAuthorData, setNewAuthorData] = useState({ name: '', email: '', password: '' })
    const [tempoaryPasswords, setTemporaryPasswords] = useState({})
    const [editingPassword, setEditingPassword] = useState(null)
    const [newPassword, setNewPassword] = useState('')

    // Загрузка авторов при монтировании
    useEffect(() => {
        const loadAuthors = async () => {
            try {
                const data = await getAuthors()
                setAuthors(data)
            } catch (err) {
                console.error('Failed to load authors:', err)
            } finally {
                setLoading(false)
            }
        }
        loadAuthors()
    }, [])

    const addAuthor = async () => {
        if (!newAuthorData.name || !newAuthorData.email || !newAuthorData.password) return
        const newAuthor = {
            id: Date.now(),
            name: newAuthorData.name,
            email: newAuthorData.email,
            passwordHash: hashPassword(newAuthorData.password),
            active: true,
            avatar: null,
            bio: ''
        }
        const updated = [...authors, newAuthor]
        setAuthors(updated)
        await saveAuthors(updated)
        // Сохраняем временно видимый пароль для отправки автору
        setTemporaryPasswords({ ...tempoaryPasswords, [newAuthor.id]: newAuthorData.password })
        setNewAuthorData({ name: '', email: '', password: '' })
        setShowNewAuthor(false)
    }

    const deleteAuthor = async (id) => {
        const updated = authors.filter(a => a.id !== id)
        setAuthors(updated)
        await saveAuthors(updated)
        const temp = { ...tempoaryPasswords }
        delete temp[id]
        setTemporaryPasswords(temp)
    }

    const toggleAuthor = async (id) => {
        const updated = authors.map(a => a.id === id ? { ...a, active: !a.active } : a)
        setAuthors(updated)
        await saveAuthors(updated)
    }

    const handleChangePassword = async (authorId) => {
        if (!newPassword) return
        const updated = authors.map(a => 
            a.id === authorId ? { ...a, passwordHash: hashPassword(newPassword) } : a
        )
        setAuthors(updated)
        await saveAuthors(updated)
        setTemporaryPasswords({ ...tempoaryPasswords, [authorId]: newPassword })
        setEditingPassword(null)
        setNewPassword('')
    }

    const copyPassword = (pwd) => {
        navigator.clipboard.writeText(pwd)
    }

    const generateNewPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
        let pwd = ''
        for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length))
        setNewPassword(pwd)
    }

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
        let pwd = ''
        for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length))
        setNewAuthorData({ ...newAuthorData, password: pwd })
    }

    const handleLogout = () => {
        localStorage.removeItem('author_user')
        setUser(null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Navbar */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10 bg-slate-900/80 backdrop-blur-xl"
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white">Admin Panel</h1>
                        <p className="text-gray-400 text-sm">Управление авторами и доступом</p>
                    </div>
                    <motion.button
                        onClick={handleLogout}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                    >
                        <LogOut size={18} />
                        Выход
                    </motion.button>
                </div>
            </motion.nav>

            {/* Content */}
            <div className="pt-24 pb-8 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Security Notice */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-4 border border-blue-500/30 bg-blue-500/5 rounded-xl mb-8 flex items-start gap-3"
                    >
                        <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                            <span className="text-xl">🔒</span>
                        </div>
                        <div className="text-sm">
                            <p className="text-blue-300 font-semibold mb-1">Защита безопасности</p>
                            <p className="text-blue-200/80">✓ Пароли хешируются и не хранятся в открытом виде</p>
                            <p className="text-blue-200/80">✓ Максимум 5 попыток входа, затем блокировка на 30 минут</p>
                            <p className="text-blue-200/80">✓ Пароли отправляются авторам при добавлении</p>
                        </div>
                    </motion.div>

                    {/* Header Actions */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2">Авторы</h2>
                            <p className="text-gray-400">Всего авторов: <span className="text-blue-400 font-bold">{authors.length}</span> | активных: <span className="text-green-400 font-bold">{authors.filter(a => a.active).length}</span></p>
                        </div>
                        <motion.button
                            onClick={() => setShowNewAuthor(true)}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/50 transition"
                        >
                            <Plus size={20} />
                            Добавить автора
                        </motion.button>
                    </div>

                    {/* New Author Form */}
                    <AnimatePresence>
                        {showNewAuthor && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="glass-card p-6 mb-8 border border-green-500/30 bg-green-500/5"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">Новый автор</h3>
                                    <button
                                        onClick={() => setShowNewAuthor(false)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition"
                                    >
                                        <X size={20} className="text-gray-400" />
                                    </button>
                                </div>

                                <p className="text-green-300/80 text-sm mb-4">
                                    💡 Пароль будет автоматически хеширован и отправлен автору
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Имя автора"
                                        value={newAuthorData.name}
                                        onChange={(e) => setNewAuthorData({ ...newAuthorData, name: e.target.value })}
                                        className="px-4 py-3 rounded-lg glass-card bg-slate-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email автора"
                                        value={newAuthorData.email}
                                        onChange={(e) => setNewAuthorData({ ...newAuthorData, email: e.target.value })}
                                        className="px-4 py-3 rounded-lg glass-card bg-slate-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Пароль"
                                            value={newAuthorData.password}
                                            onChange={(e) => setNewAuthorData({ ...newAuthorData, password: e.target.value })}
                                            className="flex-1 px-4 py-3 rounded-lg glass-card bg-slate-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <motion.button
                                            type="button"
                                            onClick={generatePassword}
                                            whileTap={{ scale: 0.9 }}
                                            className="px-4 py-3 rounded-lg bg-purple-500/30 text-purple-300 hover:bg-purple-500/50 font-semibold transition flex items-center gap-2"
                                        >
                                            <RefreshCw size={16} />
                                            Gen
                                        </motion.button>
                                    </div>
                                </div>

                                <motion.button
                                    onClick={addAuthor}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3 rounded-lg bg-green-500/30 hover:bg-green-500/50 text-green-300 font-bold transition"
                                >
                                    ✓ Добавить автора
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Authors List */}
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center py-12"
                        >
                            <div className="text-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-4"
                                />
                                <p className="text-gray-400">Загрузка авторов...</p>
                            </div>
                        </motion.div>
                    ) : (
                    <div className="space-y-4">
                        {authors.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12"
                            >
                                <p className="text-gray-400 mb-4">Авторы не найдены</p>
                                <motion.button
                                    onClick={() => setShowNewAuthor(true)}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                                >
                                    <Plus size={16} />
                                    Добавить первого автора
                                </motion.button>
                            </motion.div>
                        ) : (
                            authors.map((author, idx) => {
                                const tempPassword = tempoaryPasswords[author.id]
                                const hasPassword = !!tempPassword
                                
                                return (
                                    <motion.div
                                        key={author.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`glass-card p-6 border transition group ${
                                            hasPassword 
                                                ? 'border-green-500/50 bg-green-500/5' 
                                                : 'border-white/10 hover:border-blue-500/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-3 h-3 rounded-full ${author.active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                                <h4 className="text-lg font-bold text-white">{author.name}</h4>
                                                <span className="text-gray-400 text-sm">{author.email}</span>
                                                {hasPassword && (
                                                    <span className="px-2 py-1 rounded-full bg-green-500/30 text-green-300 text-xs font-bold">
                                                        ✓ Новый
                                                    </span>
                                                )}
                                            </div>

                                            {/* Password Display Only for New Authors */}
                                            {hasPassword && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-4 p-4 rounded-lg bg-green-900/20 border border-green-500/30"
                                                >
                                                    <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-2">
                                                        🔑 Временный пароль (отправить автору)
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <code className="flex-1 px-3 py-2 rounded-lg bg-slate-800/80 text-green-300 font-mono font-bold text-sm">
                                                            {tempPassword}
                                                        </code>
                                                        <motion.button
                                                            onClick={() => {
                                                                copyPassword(tempPassword)
                                                            }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded-lg transition"
                                                            title="Скопировать"
                                                        >
                                                            <Copy size={18} />
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <motion.button
                                                onClick={() => {
                                                    setEditingPassword(author.id)
                                                    setNewPassword('')
                                                }}
                                                whileTap={{ scale: 0.9 }}
                                                className="px-3 py-2 rounded-lg bg-blue-500/30 text-blue-300 hover:bg-blue-500/50 transition"
                                                title="Смена пароля"
                                            >
                                                <Edit2 size={18} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => toggleAuthor(author.id)}
                                                whileTap={{ scale: 0.9 }}
                                                className={`px-3 py-2 rounded-lg font-semibold transition ${
                                                    author.active
                                                        ? 'bg-green-500/30 text-green-300 hover:bg-green-500/50'
                                                        : 'bg-gray-500/30 text-gray-300 hover:bg-gray-500/50'
                                                }`}
                                            >
                                                {author.active ? 'Aktivен' : 'Blocked'}
                                            </motion.button>
                                            <motion.button
                                                onClick={() => deleteAuthor(author.id)}
                                                whileTap={{ scale: 0.9 }}
                                                className="px-3 py-2 rounded-lg bg-red-500/30 text-red-300 hover:bg-red-500/50 transition"
                                            >
                                                <Trash2 size={18} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        }))}
                    </div>
                    )}
                </div>
            </div>

            {/* Change Password Modal */}
            <AnimatePresence>
                {editingPassword && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
                        onClick={() => setEditingPassword(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card p-8 rounded-2xl border border-blue-500/30 bg-blue-500/5 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-white">🔐 Смена пароля</h3>
                                <button
                                    onClick={() => setEditingPassword(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <p className="text-blue-200 text-sm mb-4">
                                Автор: <span className="font-bold">{authors.find(a => a.id === editingPassword)?.name}</span>
                            </p>

                            <div className="space-y-4 mb-6">
                                <input
                                    type="text"
                                    placeholder="Новый пароль"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg glass-card bg-slate-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <motion.button
                                    onClick={generateNewPassword}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full px-4 py-3 rounded-lg bg-purple-500/30 hover:bg-purple-500/50 text-purple-300 font-semibold transition flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={18} />
                                    Сгенерировать пароль
                                </motion.button>
                            </div>

                            {newPassword && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-lg bg-green-900/20 border border-green-500/30 mb-6"
                                >
                                    <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-2">
                                        ✓ Новый пароль
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <code className="flex-1 px-3 py-2 rounded-lg bg-slate-800/80 text-green-300 font-mono font-bold text-sm">
                                            {newPassword}
                                        </code>
                                        <motion.button
                                            onClick={() => copyPassword(newPassword)}
                                            whileTap={{ scale: 0.9 }}
                                            className="p-2 bg-green-500/30 hover:bg-green-500/50 text-green-300 rounded-lg transition"
                                        >
                                            <Copy size={18} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex gap-3">
                                <motion.button
                                    onClick={() => {
                                        if (newPassword) {
                                            handleChangePassword(editingPassword)
                                        }
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={!newPassword}
                                    className="flex-1 py-3 rounded-lg bg-green-500/30 hover:bg-green-500/50 text-green-300 font-bold transition disabled:opacity-50"
                                >
                                    ✓ Применить
                                </motion.button>
                                <motion.button
                                    onClick={() => setEditingPassword(null)}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex-1 py-3 rounded-lg bg-gray-500/30 hover:bg-gray-500/50 text-gray-300 font-bold transition"
                                >
                                    Отмена
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
