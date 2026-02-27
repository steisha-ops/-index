/**
 * API Client для взаимодействия с Index Oblav V6 сервером
 * 
 * Используется для синхронизации:
 * - Авторов
 * - Новостей
 * - Профилей авторов
 */

// API Base URL - укажите URL вашего index-oblav-v6 сервера
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

/**
 * Авторизация автора в системе
 * @param {string} email - Email автора
 * @param {string} passwordHash - Хеш пароля
 * @returns {Promise<Object>} - Данные автора с токеном
 */
export const authorLogin = async (email, passwordHash) => {
    try {
        // Для demo используем mock авторизацию
        // В продакшене это будет API запрос к серверу
        return {
            success: true,
            author: {
                id: Math.random().toString(36).substr(2, 9),
                email,
                name: email.split('@')[0],
                passwordHash
            },
            token: 'demo_token_' + Date.now()
        }
    } catch (error) {
        console.error('Author login error:', error)
        throw error
    }
}

/**
 * Получить всех авторов (демо - с mock данными)
 */
export const getAuthors = async () => {
    try {
        // Демо: возвращаем локальные авторы
        const stored = localStorage.getItem('authors_list')
        if (stored) return JSON.parse(stored)
        
        return [
            { id: 1, name: 'Иван Петров', email: 'ivan@example.com', avatar: null, active: true, bio: 'Автор и эксперт' },
            { id: 2, name: 'Мария Сидорова', email: 'maria@example.com', avatar: null, active: true, bio: 'Журналист' },
            { id: 3, name: 'Алексей Смирнов', email: 'alex@example.com', avatar: null, active: true, bio: 'Аналитик' }
        ]
    } catch (error) {
        console.error('Get authors error:', error)
        return []
    }
}

/**
 * Сохранить авторов в локальное хранилище
 */
export const saveAuthors = async (authors) => {
    try {
        localStorage.setItem('authors_list', JSON.stringify(authors))
        return { success: true }
    } catch (error) {
        console.error('Save authors error:', error)
        throw error
    }
}

/**
 * Получить профиль автора
 */
export const getAuthorProfile = async (authorId) => {
    try {
        const authors = await getAuthors()
        return authors.find(a => a.id === authorId)
    } catch (error) {
        console.error('Get profile error:', error)
        throw error
    }
}

/**
 * Обновить профиль автора
 */
export const updateAuthorProfile = async (authorId, profileData) => {
    try {
        const authors = await getAuthors()
        const updated = authors.map(a =>
            a.id === authorId ? { ...a, ...profileData } : a
        )
        await saveAuthors(updated)
        return updated.find(a => a.id === authorId)
    } catch (error) {
        console.error('Update profile error:', error)
        throw error
    }
}

/**
 * Получить все новости автора
 */
export const getAuthorNews = async (authorId) => {
    try {
        const stored = localStorage.getItem(`news_${authorId}`)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error('Get news error:', error)
        return []
    }
}

/**
 * Создать новую новость
 */
export const createNews = async (authorId, newsData) => {
    try {
        const news = await getAuthorNews(authorId)
        const newNews = {
            id: Date.now(),
            ...newsData,
            createdAt: new Date().toISOString(),
            authorId
        }
        news.push(newNews)
        localStorage.setItem(`news_${authorId}`, JSON.stringify(news))
        return newNews
    } catch (error) {
        console.error('Create news error:', error)
        throw error
    }
}

/**
 * Обновить новость
 */
export const updateNews = async (authorId, newsId, newsData) => {
    try {
        const news = await getAuthorNews(authorId)
        const updated = news.map(n =>
            n.id === newsId ? { ...n, ...newsData } : n
        )
        localStorage.setItem(`news_${authorId}`, JSON.stringify(updated))
        return updated.find(n => n.id === newsId)
    } catch (error) {
        console.error('Update news error:', error)
        throw error
    }
}

/**
 * Удалить новость
 */
export const deleteNews = async (authorId, newsId) => {
    try {
        const news = await getAuthorNews(authorId)
        const filtered = news.filter(n => n.id !== newsId)
        localStorage.setItem(`news_${authorId}`, JSON.stringify(filtered))
        return { success: true }
    } catch (error) {
        console.error('Delete news error:', error)
        throw error
    }
}

/**
 * Загрузить изображение (base64)
 */
export const uploadImage = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
