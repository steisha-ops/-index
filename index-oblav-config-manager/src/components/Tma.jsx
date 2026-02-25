
import React, { useState } from 'react';

const Tma = () => {
    const [activeTab, setActiveTab] = useState('news');

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">ТМА: Редактор контента</h1>
            
            <div className="flex border-b mb-4">
                <button 
                    className={`py-2 px-4 ${activeTab === 'news' ? 'border-b-2 border-blue-500' : ''}`}
                    onClick={() => setActiveTab('news')}
                >
                    Новости
                </button>
                <button 
                    className={`py-2 px-4 ${activeTab === 'authors' ? 'border-b-2 border-blue-500' : ''}`}
                    onClick={() => setActiveTab('authors')}
                >
                    Авторы
                </button>
                 <button 
                    className={`py-2 px-4 ${activeTab === 'widgets' ? 'border-b-2 border-blue-500' : ''}`}
                    onClick={() => setActiveTab('widgets')}
                >
                    Виджеты
                </button>
            </div>

            <div>
                {activeTab === 'news' && <div>Управление новостями (в разработке)</div>}
                {activeTab === 'authors' && <div>Управление авторами (в разработке)</div>}
                {activeTab === 'widgets' && <div>Создание виджетов (скоро)</div>}
            </div>
        </div>
    );
};

export default Tma;
