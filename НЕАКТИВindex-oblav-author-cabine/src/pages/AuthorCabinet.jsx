import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Upload, Save, Plus, Edit2, Trash2, Eye, EyeOff, Zap, Sparkles, Rocket } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { getAuthorNews, createNews, updateNews, deleteNews, updateAuthorProfile, uploadImage } from '../lib/api'

export default function AuthorCabinet({ user, setUser }) {
    const [activeTab, setActiveTab] = useState('profile') // profile, news, widgets
    const [profile, setProfile] = useState({
        name: user?.name || '',
        bio: user?.bio || 'Краткая биография автора',
        avatar: user?.avatar || null,
        handle: user?.email?.split('@')[0] || '',
        isVerified: false
    })
    const [news, setNews] = useState([])
    const [editingNews, setEditingNews] = useState(null)
    const [newNewsData, setNewNewsData] = useState({ title: '', content: '', highlighted: false })
    const [previewMode, setPreviewMode] = useState(false)
    const [loading, setLoading] = useState(false)

    // Загрузка новостей при монтировании
    useEffect(() => {
        const loadNews = async () => {
            try {
                const data = await getAuthorNews(user?.id)
                setNews(data)
            } catch (err) {
                console.error('Failed to load news:', err)
            }
        }
        if (user?.id) {
            loadNews()
        }
    }, [user?.id])

    const handleProfileChange = (field, value) => {
        setProfile({ ...profile, [field]: value })
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setLoading(true)
            try {
                const dataUrl = await uploadImage(file)
                setProfile({ ...profile, avatar: dataUrl })
            } catch (err) {
                console.error('Failed to upload image:', err)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleSaveProfile = async () => {
        setLoading(true)
        try {
            const updated = await updateAuthorProfile(user?.id, profile)
            setProfile(updated)
            // Обновляем user в localStorage
            const updatedUser = { ...user, ...profile }
            localStorage.setItem('author_user', JSON.stringify(updatedUser))
            alert('Профиль сохранён!')
        } catch (err) {
            console.error('Failed to save profile:', err)
            alert('Ошибка при сохранении профиля')
        } finally {
            setLoading(false)
        }
    }

    const handleAddNews = async () => {
        if (!newNewsData.title || !newNewsData.content) {
            alert('Заполните название и содержание новости')
            return
        }

        setLoading(true)
        try {
            if (editingNews) {
                // Обновляем существующую новость
                await updateNews(user?.id, editingNews.id, newNewsData)
                setNews(news.map(n => n.id === editingNews.id ? { ...n, ...newNewsData } : n))
                setEditingNews(null)
            } else {
                // Создаём новую новость
                const created = await createNews(user?.id, { ...newNewsData, date: new Date().toISOString() })
                setNews([created, ...news])
            }
            setNewNewsData({ title: '', content: '', highlighted: false })
            alert('Новость сохранена!')
        } catch (err) {
            console.error('Failed to save news:', err)
            alert('Ошибка при сохранении новости')
        } finally {
            setLoading(false)
        }
    }

    const handleEditNews = (n) => {
        setEditingNews(n)
        setNewNewsData({ title: n.title, content: n.content, highlighted: n.highlighted })
    }

    const handleDeleteNews = async (id) => {
        setLoading(true)
        try {
            await deleteNews(user?.id, id)
            setNews(news.filter(n => n.id !== id))
            if (editingNews?.id === id) {
                setEditingNews(null)
                setNewNewsData({ title: '', content: '', highlighted: false })
            }
            alert('Новость удалена!')
        } catch (err) {
            console.error('Failed to delete news:', err)
            alert('Ошибка при удалении новости')
        } finally {
            setLoading(false)
        }
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
                        <h1 className="text-2xl font-black text-white">Author Cabinet</h1>
                        <p className="text-gray-400 text-sm">Привет, {user?.name}!</p>
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

            {/* Tabs */}
            <div className="pt-24 pb-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-4 mb-8">
                        {[
                            { id: 'profile', label: 'Мой профиль', icon: '👤' },
                            { id: 'news', label: 'Новости', icon: '📰' },
                            { id: 'widgets', label: 'Виджеты', icon: '✨' }
                        ].map(tab => (
                            <motion.button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition ${
                                    activeTab === tab.id
                                        ? 'bg-blue-500/30 border border-blue-500/50 text-blue-300'
                                        : 'glass-card border border-white/10 text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <span className="text-xl">{tab.icon}</span>
                                {tab.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Profile Tab */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {/* Avatar Section */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="glass-card p-8 border border-white/10"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-6">Фото профиля</h2>
                                    
                                    <div className="flex items-start gap-8">
                                        <div className="flex-shrink-0">
                                            <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                                                <div className="w-full h-full rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center">
                                                    {profile.avatar ? (
                                                        <img src={profile.avatar} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-5xl">📷</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <label className="block mb-4">
                                                <span className="block text-sm font-bold text-gray-300 mb-2">Загрузить фото</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/30 file:text-blue-300 hover:file:bg-blue-500/50 cursor-pointer"
                                                />
                                            </label>
                                            <p className="text-gray-400 text-sm">Рекомендуемый размер: 400x400px</p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Info Section */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass-card p-8 border border-white/10"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-6">Информация профиля</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Имя</label>
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => handleProfileChange('name', e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg glass-card bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Ник (@handle)</label>
                                            <input
                                                type="text"
                                                value={profile.handle}
                                                onChange={(e) => handleProfileChange('handle', e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg glass-card bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="username"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Биография</label>
                                            <textarea
                                                value={profile.bio}
                                                onChange={(e) => handleProfileChange('bio', e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg glass-card bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                rows="4"
                                                placeholder="Расскажите о себе..."
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                            <input
                                                type="checkbox"
                                                checked={profile.isVerified}
                                                onChange={(e) => handleProfileChange('isVerified', e.target.checked)}
                                                id="verified"
                                                className="w-4 h-4 rounded"
                                            />
                                            <label htmlFor="verified" className="flex-1 text-sm font-semibold text-blue-300 cursor-pointer">
                                                ✓ Запросить верификацию (синяя галочка)
                                            </label>
                                        </div>
                                    </div>

                                    <motion.button
                                        onClick={handleSaveProfile}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/50 transition flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        Сохранить профиль
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* News Tab */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'news' && (
                            <motion.div
                                key="news"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {/* News Editor */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="glass-card p-8 border border-green-500/30 bg-green-500/5"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-white">
                                            {editingNews ? '✎ Редактировать новость' : '✍️ Новая новость'}
                                        </h2>
                                        {editingNews && (
                                            <button
                                                onClick={() => {
                                                    setEditingNews(null)
                                                    setNewNewsData({ title: '', content: '', highlighted: false })
                                                }}
                                                className="text-gray-400 hover:text-gray-300"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Название новости"
                                            value={newNewsData.title}
                                            onChange={(e) => setNewNewsData({ ...newNewsData, title: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg glass-card bg-slate-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                                        />

                                        <div>
                                            <label className="text-sm text-gray-300 font-semibold mb-2 block">Содержание</label>
                                            <ReactQuill
                                                theme="snow"
                                                value={newNewsData.content}
                                                onChange={(content) => setNewNewsData({ ...newNewsData, content })}
                                                modules={{
                                                    toolbar: [
                                                        [{ 'header': [1, 2, 3, false] }],
                                                        ['bold', 'italic', 'underline', 'strike'],
                                                        [{ 'color': [] }, { 'background': [] }],
                                                        ['blockquote', 'code-block'],
                                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                        ['link', 'image', 'video'],
                                                        ['clean']
                                                    ]
                                                }}
                                                style={{ height: '300px', marginBottom: '50px' }}
                                                className="bg-slate-800/50 text-white"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                                            <input
                                                type="checkbox"
                                                checked={newNewsData.highlighted}
                                                onChange={(e) => setNewNewsData({ ...newNewsData, highlighted: e.target.checked })}
                                                id="highlighted"
                                                className="w-4 h-4 rounded"
                                            />
                                            <label htmlFor="highlighted" className="flex-1 text-sm font-semibold text-yellow-300 cursor-pointer">
                                                ⭐ Выделить как важную новость
                                            </label>
                                        </div>

                                        <motion.button
                                            onClick={handleAddNews}
                                            whileTap={{ scale: 0.95 }}
                                            className="w-full py-3 rounded-lg bg-green-500/30 hover:bg-green-500/50 text-green-300 font-bold transition"
                                        >
                                            {editingNews ? '💾 Обновить' : '➕ Опубликовать'}
                                        </motion.button>
                                    </div>
                                </motion.div>

                                {/* News List */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h2 className="text-2xl font-bold text-white mb-6">Ваши новости ({news.length})</h2>

                                    <div className="space-y-4">
                                        {news.map((n, idx) => (
                                            <motion.div
                                                key={n.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`glass-card p-6 border transition ${
                                                    n.highlighted
                                                        ? 'border-yellow-500/30 bg-yellow-500/5'
                                                        : 'border-white/10 hover:border-blue-500/30'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {n.highlighted && <span className="text-lg">⭐</span>}
                                                            <h3 className="text-lg font-bold text-white">{n.title}</h3>
                                                        </div>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(n.date).toLocaleDateString('ru-RU', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <motion.button
                                                            onClick={() => handleEditNews(n)}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 bg-blue-500/30 hover:bg-blue-500/50 text-blue-300 rounded-lg transition"
                                                        >
                                                            <Edit2 size={16} />
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => handleDeleteNews(n.id)}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 bg-red-500/30 hover:bg-red-500/50 text-red-300 rounded-lg transition"
                                                        >
                                                            <Trash2 size={16} />
                                                        </motion.button>
                                                    </div>
                                                </div>

                                                <div className="prose prose-invert prose-sm max-w-none">
                                                    <div className="text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: n.content }}></div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Widgets Tab */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'widgets' && (
                            <motion.div
                                key="widgets"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-center min-h-[600px]"
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 100 }}
                                    className="max-w-2xl w-full"
                                >
                                    {/* Animated Background */}
                                    <div className="relative">
                                        <motion.div
                                            animate={{
                                                rotate: 360,
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{
                                                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                                                scale: { duration: 3, repeat: Infinity }
                                            }}
                                            className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl opacity-20 blur-2xl"
                                        />
                                        
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="relative glass-card p-12 border border-white/20 text-center backdrop-blur-xl"
                                        >
                                            {/* Floating Icons */}
                                            <motion.div
                                                animate={{ y: [-10, 10, -10] }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className="mb-8 flex justify-center gap-4"
                                            >
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 15 }}
                                                    className="text-6xl"
                                                >
                                                    <Sparkles className="text-purple-400" size={64} />
                                                </motion.div>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                                    className="text-6xl"
                                                >
                                                    <Zap className="text-cyan-400" size={64} />
                                                </motion.div>
                                                <motion.div
                                                    animate={{ y: [10, -10, 10] }}
                                                    transition={{ duration: 3, repeat: Infinity }}
                                                    className="text-6xl"
                                                >
                                                    <Rocket className="text-pink-400" size={64} />
                                                </motion.div>
                                            </motion.div>

                                            <motion.h2
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="text-4xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent mb-4"
                                            >
                                                Скоро!
                                            </motion.h2>

                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.4 }}
                                                className="text-lg text-gray-300 mb-6 leading-relaxed"
                                            >
                                                Система управления виджетами находится в разработке. Скоро вы сможете создавать и настраивать собственные виджеты для своего профиля.
                                            </motion.p>

                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.5 }}
                                                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                                            >
                                                <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50 text-purple-300 font-bold text-sm">
                                                    ✨ Новые возможности
                                                </div>
                                                <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-sm">
                                                    ⚡ Улучшенный функционал
                                                </div>
                                            </motion.div>

                                            {/* Animated Progress Bar */}
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.6 }}
                                                className="mt-8"
                                            >
                                                <p className="text-xs text-gray-400 mb-2">В разработке</p>
                                                <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/50">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: '65%' }}
                                                        transition={{ delay: 0.8, duration: 1.5, ease: 'easeOut' }}
                                                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Orbiting Elements */}
                                            <div className="mt-12 relative h-32 flex items-center justify-center">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                                        className="absolute w-24 h-24 border-2 border-gray-600/30 rounded-full"
                                                    />
                                                    <motion.div
                                                        animate={{ rotate: -360 }}
                                                        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                                                        className="absolute w-32 h-32 border-2 border-gray-600/20 rounded-full"
                                                    />
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                        className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full shadow-lg shadow-cyan-400/50"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
