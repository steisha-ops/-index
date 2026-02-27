/**
 * Security utilities for password hashing and IP-based login protection
 */

// Простое шифрование пароля (в продакшене используйте bcryptjs на сервере)
export const hashPassword = (password) => {
    // Используем простой хеш для демонстрации
    let hash = 0
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
}

// Проверка пароля
export const verifyPassword = (password, hash) => {
    return hashPassword(password) === hash
}

// Получить IP адрес (на фронтенде используем эмуляцию)
export const getClientIP = () => {
    // На фронтенде реальный IP получить нельзя, используем fingerprint
    return localStorage.getItem('client_fingerprint') || generateFingerprint()
}

// Генерация уникального отпечатка устройства
export const generateFingerprint = () => {
    const fingerprint = `${navigator.userAgent}-${navigator.language}-${new Date().getTimezoneOffset()}`
    const hash = hashPassword(fingerprint)
    localStorage.setItem('client_fingerprint', hash)
    return hash
}

// Получить попытки входа для IP
export const getLoginAttempts = (identifier) => {
    const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}')
    return attempts[identifier] || { count: 0, blockedUntil: null, lastAttempt: null }
}

// Записать попытку входа
export const recordLoginAttempt = (identifier, success = false) => {
    const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}')
    const current = attempts[identifier] || { count: 0, blockedUntil: null, lastAttempt: null }
    
    if (!success) {
        current.count += 1
        current.lastAttempt = new Date().getTime()
        
        // Блокировка на 30 минут после 5 неудачных попыток
        if (current.count >= 5) {
            current.blockedUntil = new Date().getTime() + 30 * 60 * 1000 // 30 минут
        }
    } else {
        // После успешного входа сбросить счетчик
        current.count = 0
        current.blockedUntil = null
    }
    
    attempts[identifier] = current
    localStorage.setItem('login_attempts', JSON.stringify(attempts))
    return current
}

// Проверить, заблокирован ли IP
export const isIPBlocked = (identifier) => {
    const attempts = getLoginAttempts(identifier)
    
    if (attempts.blockedUntil) {
        const now = new Date().getTime()
        if (now < attempts.blockedUntil) {
            const remainingMinutes = Math.ceil((attempts.blockedUntil - now) / 60000)
            return { blocked: true, remainingMinutes }
        } else {
            // Разблокировать
            const allAttempts = JSON.parse(localStorage.getItem('login_attempts') || '{}')
            allAttempts[identifier] = { count: 0, blockedUntil: null, lastAttempt: null }
            localStorage.setItem('login_attempts', JSON.stringify(allAttempts))
            return { blocked: false, remainingMinutes: 0 }
        }
    }
    
    return { blocked: false, remainingMinutes: 0 }
}

// Получить оставшиеся попытки
export const getRemainingAttempts = (identifier) => {
    const attempts = getLoginAttempts(identifier)
    return Math.max(0, 5 - attempts.count)
}

// Очистить попытки входа (для администратора)
export const clearLoginAttempts = (identifier) => {
    const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}')
    delete attempts[identifier]
    localStorage.setItem('login_attempts', JSON.stringify(attempts))
}
