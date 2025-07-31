// frontend/src/shared/ui/components/DebugReduxState.js
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

const DebugReduxState = () => {
    const requests = useSelector(state => state.requests);
    const auth = useSelector(state => state.auth);

    // 1. Добавляем состояние для отслеживания свернутого вида
    const [isCollapsed, setIsCollapsed] = useState(false);

    // 2. Функция для переключения состояния
    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    if (process.env.NODE_ENV !== 'development') return null;

    // --- Стили для анимации и позиционирования ---

    // Основной контейнер
    const containerStyle = {
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 80,
        background: 'rgba(20, 20, 20, 0.9)',
        color: '#f0f0f0',
        borderRadius: '8px',
        width: 400,
        maxWidth: '90vw',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        zIndex: 9999,
    };

    // Хедер
    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        cursor: 'pointer',
        borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)',
    };

    // Контент (блок с <pre>)
    const contentStyle = {
        // Плавная анимация для всех свойств
        transition: 'all 0.3s ease-in-out',
        // Анимируем высоту, прозрачность и отступы
        maxHeight: isCollapsed ? 0 : '300px',
        opacity: isCollapsed ? 0 : 1,
        overflow: 'auto',
        padding: isCollapsed ? '0 12px' : '12px',
    };

    // Кнопка
    const buttonStyle = {
        background: 'transparent',
        border: 'none',
        color: '#a0a0a0',
        padding: '0 4px',
    };

    return (
        <div style={containerStyle}>
            {/* 3. Весь хедер теперь кликабельный */}
            <div style={headerStyle} onClick={toggleCollapse}>
                <h6 style={{ margin: 0, fontSize: '14px' }}>Redux State Debug</h6>
                <button style={buttonStyle} title={isCollapsed ? "Expand" : "Collapse"}>
                    {/* Иконка меняется в зависимости от состояния */}
                    <i className={`bi ${isCollapsed ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                </button>
            </div>

            {/* 4. Контент с анимируемыми стилями */}
            <div style={contentStyle}>
                <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify({ requests, auth }, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default DebugReduxState;