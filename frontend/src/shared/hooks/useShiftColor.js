// frontend/src/shared/hooks/useShiftColor.js
import {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {updateShiftColor} from '../../features/admin-schedule-management/model/scheduleSlice';
import ThemeColorService from 'shared/lib/services/ThemeColorService';
import {updatePositionShiftColor} from "../api/apiService";

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
        // --- ПЕРЕНОСИМ ОЧИСТКУ СЮДА ---
        // Очищаем временный цвет при любом закрытии модала.
        setTempShiftColors(prev => {
            const newState = { ...prev };
            // Проверяем, есть ли shiftId, чтобы не было ошибок
            if (colorPickerState.shiftId) {
                delete newState[colorPickerState.shiftId];
            }
            return newState;
        });
        // ---------------------------------

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
        const shiftId = colorPickerState.shiftId;
        const saveMode = customSaveMode || colorPickerState.saveMode;
        // Запоминаем цвет для возможного отката
        const originalColorForRevert = colorPickerState.originalColor;

        // Очищаем превью СРАЗУ, так как дальше UI будет управляться Redux или localStorage
        setTempShiftColors(prev => {
            const newState = { ...prev };
            delete newState[shiftId];
            return newState;
        });

        if (saveMode === 'local') {
            // Локальное сохранение. Просто и надежно. Не трогаем Redux.
            try {
                ThemeColorService.setColor(shiftId, color, currentTheme, isAdmin && currentTheme === 'dark');
                return true;
            } catch (error) {
                console.error('Ошибка сохранения в localStorage:', error);
                return false;
            }
        } else { // saveMode === 'global'
            // --- ЛОГИКА ОПТИМИСТИЧНОГО ОБНОВЛЕНИЯ С ОТКАТОМ ---

            // 1. ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ UI:
            // Диспатчим новый цвет немедленно. "Мигания" не будет.
            dispatch(updateShiftColor({ shiftId, color }));

            // 2. ФОНОВОЕ СОХРАНЕНИЕ В БД:
            try {
                // Пытаемся сохранить данные на сервере.
                // Мы не ждем (await) завершения здесь в основном потоке,
                // чтобы UI оставался отзывчивым.
                await updatePositionShiftColor(shiftId, color);
                return true;
            } catch (error) {
                // 3. ОТКАТ ПРИ ОШИБКЕ СЕТИ:
                console.error('Сетевая ошибка, откат UI:', error);
                // Если сохранение не удалось, диспатчим старый цвет обратно.
                dispatch(updateShiftColor({ shiftId, color: originalColorForRevert }));
                // Можно показать пользователю уведомление об ошибке.
                return false;
            }
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

        // --- НАЧАЛО ИЗМЕНЕНИЙ ---

        // 1. Получаем объект смены из состояния модала
        const shiftObject = colorPickerState.shift;
        if (!shiftObject) return; // Защита на всякий случай

        // 2. Диспатчим экшен с глобальным цветом из БД, чтобы Redux был в порядке
        const globalColor = shiftObject.color || '#6c757d';
        dispatch(updateShiftColor({
            shiftId: shiftId,
            color: globalColor
        }));

        // 3. А теперь самое главное: вычисляем, какой цвет ДОЛЖЕН БЫТЬ после сброса
        //    с учетом всех правил (включая темную тему админа и т.д.)
        //    Мы как бы "симулируем" вызов getShiftColor для сброшенного состояния.

        // Создаем "сброшенный" объект смены, где локального цвета уже нет
        const resetShift = { ...shiftObject, color: globalColor };

        // Вызываем ThemeColorService, чтобы он определил правильный цвет для текущей темы
        // 4. Возвращаем этот ПРАВИЛЬНЫЙ цвет
        return ThemeColorService.getShiftColor(resetShift, currentTheme, user?.role);
    };

    return {
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor,
        currentTheme,
        userRole: user?.role,
        shiftObject: colorPickerState.shift,
        isAdmin,
        hasLocalColor: colorPickerState.hasLocalColor,
        resetShiftColor: () => resetShiftColor(colorPickerState.shiftId), // Сразу передаем shiftId
        // hasLocalColors: ThemeColorService.hasCustomColors(currentTheme, isAdmin && currentTheme === 'dark'),
        resetColors: () => ThemeColorService.clearColors(currentTheme, isAdmin && currentTheme === 'dark'),
        // resetShiftColor, // Новый метод для сброса цвета конкретной смены
        determineSaveMode // Экспортируем для тестирования
    };
};