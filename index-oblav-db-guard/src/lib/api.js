
// Этот файл настраивает "общение" между интерфейсом и защищенным сервером DB Guard

// Убираем полный адрес. Теперь Vite будет использовать прокси, указанный в vite.config.js
const BASE_URL = ''; 

// Функция для скачивания данных в формате CSV (совместим с Excel)
function downloadCSV(data, filename = 'reports.csv') {
    if (!data || data.length === 0) {
        alert("Нет данных для скачивания.");
        return;
    }

    const replacer = (key, value) => value === null ? '' : value; 
    const header = Object.keys(data[0]);
    const csv = [
        header.join(','), // заголовок таблицы
        ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { 
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}


export const api = {
    // Получает репорты с защищенного сервера через прокси
    getReports: async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/reports`);
            if (response.status === 401) {
                // Это значит, что пользователь не ввел пароль или ввел неверный
                alert("Ошибка аутентификации. Обновите страницу и введите правильный пароль.");
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error("Ошибка при загрузке репортов:", error);
            alert("Не удалось подключиться к серверу DB Guard. Убедитесь, что он запущен и вы перезапустили Vite.");
            return [];
        }
    },

    // Удаляет репорт через защищенный сервер
    deleteReport: async (id) => {
        await fetch(`${BASE_URL}/api/reports/${id}`, { method: 'DELETE' });
    },

    // Получает статистику CPU/RAM
    getStats: async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/stats`);
            if(response.ok) return await response.json();
            return { cpu: 0, ram: 0 };
        } catch(e) {
            return { cpu: 0, ram: 0 };
        }
    },

    // Вызывает функцию скачивания
    downloadExcel: (data) => {
        downloadCSV(data);
    }
}; 
