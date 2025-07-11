// frontend/src/shared/hooks/useShiftColor.js
import {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateShiftColor } from '../../features/admin-schedule-management/model/scheduleSlice';
import { updatePositionShiftColor } from 'shared/api/apiService';
import ThemeColorService from 'shared/lib/services/ThemeColorService';

export const useShiftColor = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const isAdmin = user?.role === 'admin';
    const [currentTheme, setCurrentTheme] = useState(
        document.documentElement.getAttribute('data-theme') || 'light'
    );
    // Состояние для color picker
    const [colorPickerState, setColorPickerState] = useState({
        show: false,
        shiftId: null,
        currentColor: '#6c757d',
        originalColor: '#6c757d',
        saveMode: 'global'
    });

    // Временное состояние для предпросмотра
    const [tempShiftColors, setTempShiftColors] = useState({});

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setCurrentTheme(document.documentElement.getAttribute('data-theme') || 'light');
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);

    // Метод для получения оригинального цвета из БД
    const getOriginalGlobalColor = (shift) => {
        return shift.color || '#6c757d';
    };

    const determineSaveMode = (explicitMode = null) => {
        // Если режим явно указан, используем его
        if (explicitMode) {
            return explicitMode;
        }

        // Для сотрудников всегда локально
        if (!isAdmin) {
            return 'local';
        }

        // Для админов в темной теме - локально
        if (isAdmin && currentTheme === 'dark') {
            return 'local';
        }

        // Для админов в светлой теме - глобально
        return 'global';
    };

    const openColorPicker = (shiftId, currentColor, shift = null, explicitMode = null) => {
        const mode = determineSaveMode(explicitMode);
        const shiftIdKey = String(shiftId); // Убедимся что ключ - строка

        // Проверяем есть ли локальный цвет для этой смены
        const localColors = ThemeColorService.getColors(currentTheme, isAdmin && currentTheme === 'dark');
        const hasLocalColorForShift = !!(localColors && localColors[shiftIdKey]);

        // Получаем оригинальный глобальный цвет
        const originalGlobalColor = shift ? (shift.color || '#6c757d') : '#6c757d';

        setColorPickerState({
            show: true,
            shiftId: shiftId,
            currentColor: currentColor || originalGlobalColor,
            originalColor: currentColor || originalGlobalColor,
            saveMode: mode,
            hasLocalColor: hasLocalColorForShift,
            originalGlobalColor: originalGlobalColor,
            shift: shift
        });
    };

    const closeColorPicker = () => {
        // Очищаем временный цвет
        setTempShiftColors(prev => {
            const newState = { ...prev };
            delete newState[colorPickerState.shiftId];
            return newState;
        });

        setColorPickerState({
            show: false,
            shiftId: null,
            currentColor: '#6c757d',
            originalColor: '#6c757d'
        });
    };

    const previewColor = (color) => {
        setTempShiftColors(prev => ({
            ...prev,
            [colorPickerState.shiftId]: color
        }));
    };

    const applyColor = async (color, customSaveMode = null) => {
        try {
            const shiftId = colorPickerState.shiftId;
            const saveMode = customSaveMode || colorPickerState.saveMode;

            if (saveMode === 'local') {
                // Сохраняем локально
                ThemeColorService.setColor(
                    shiftId,
                    color,
                    currentTheme,
                    isAdmin && currentTheme === 'dark' // Для админа в темной теме
                );

                // Обновляем Redux для текущей сессии
                dispatch(updateShiftColor({
                    shiftId: shiftId,
                    color: color
                }));
            } else {
                // Сохраняем глобально в БД
                await updatePositionShiftColor(shiftId, color);

                dispatch(updateShiftColor({
                    shiftId: shiftId,
                    color: color
                }));
            }

            // Очищаем временный цвет
            setTempShiftColors(prev => {
                const newState = { ...prev };
                delete newState[shiftId];
                return newState;
            });

            return true;
        } catch (error) {
            console.error('Error updating shift color:', error);
            return false;
        }
    };

    const getShiftColor = (shift) => {
        // Проверяем временный цвет для предпросмотра
        if (tempShiftColors[shift.shift_id]) {
            return tempShiftColors[shift.shift_id];
        }

        // Используем сервис для получения цвета
        return ThemeColorService.getShiftColor(shift, currentTheme, user?.role);
    };

    const resetShiftColor = (shiftId) => {
        const shiftIdKey = String(shiftId);
        const isAdminDarkTheme = isAdmin && currentTheme === 'dark';

        // Получаем текущие локальные цвета
        const storageKey = isAdminDarkTheme
            ? ThemeColorService.ADMIN_DARK_KEY
            : ThemeColorService.STORAGE_KEY;

        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const data = JSON.parse(stored);
            if (data[currentTheme] && data[currentTheme][shiftIdKey]) {
                // Удаляем только цвет этой смены
                delete data[currentTheme][shiftIdKey];

                // Если больше нет цветов для этой темы, удаляем и тему
                if (Object.keys(data[currentTheme]).length === 0) {
                    delete data[currentTheme];
                }

                // Сохраняем обратно
                if (Object.keys(data).length > 0) {
                    localStorage.setItem(storageKey, JSON.stringify(data));
                } else {
                    localStorage.removeItem(storageKey);
                }
            }
        }

        // Обновляем Redux с глобальным цветом
        if (colorPickerState.originalGlobalColor) {
            dispatch(updateShiftColor({
                shiftId: shiftId,
                color: colorPickerState.originalGlobalColor
            }));
        }
    };

    return {
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor,
        currentTheme,
        isAdmin,
        hasLocalColors: ThemeColorService.hasCustomColors(currentTheme, isAdmin && currentTheme === 'dark'),
        resetColors: () => ThemeColorService.clearColors(currentTheme, isAdmin && currentTheme === 'dark'),
        resetShiftColor, // Новый метод для сброса цвета конкретной смены
        determineSaveMode // Экспортируем для тестирования
    };
};