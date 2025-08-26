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
    const [colorPickerState, setColorPickerState] = useState({
        show: false,
        shiftId: null,
        currentColor: '#6c757d',
        originalColor: '#6c757d',
        saveMode: 'global'
    });


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



    const determineSaveMode = (explicitMode = null) => {

        if (explicitMode) {
            return explicitMode;
        }

        if (!isAdmin) {
            return 'local';
        }

        if (isAdmin && currentTheme === 'dark') {
            return 'local';
        }

        return 'global';
    };

    const openColorPicker = (shiftId, currentColor, shift = null, explicitMode = null) => {
        const mode = determineSaveMode(explicitMode);
        const shiftIdKey = String(shiftId);

        const localColors = ThemeColorService.getColors(currentTheme, isAdmin && currentTheme === 'dark');
        const hasLocalColorForShift = !!(localColors && localColors[shiftIdKey]);

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
        const originalColorForRevert = colorPickerState.originalColor;

        setTempShiftColors(prev => {
            const newState = { ...prev };
            delete newState[shiftId];
            return newState;
        });

        if (saveMode === 'local') {
            try {
                ThemeColorService.setColor(shiftId, color, currentTheme, isAdmin && currentTheme === 'dark');
                return true;
            } catch (error) {
                console.error('Ошибка сохранения в localStorage:', error);
                return false;
            }
        } else { // saveMode === 'global'
            dispatch(updateShiftColor({ shiftId, color }));
            try {
                await updatePositionShiftColor(shiftId, color);
                return true;
            } catch (error) {
                console.error('Network error, UI rollback:', error);
                dispatch(updateShiftColor({ shiftId, color: originalColorForRevert }));
                return false;
            }
        }
    };

    const getShiftColor = (shift) => {
        if (tempShiftColors[shift.shift_id]) {
            return tempShiftColors[shift.shift_id];
        }

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

                delete data[currentTheme][shiftIdKey];

                if (Object.keys(data[currentTheme]).length === 0) {
                    delete data[currentTheme];
                }

                if (Object.keys(data).length > 0) {
                    localStorage.setItem(storageKey, JSON.stringify(data));
                } else {
                    localStorage.removeItem(storageKey);
                }
            }
        }

        const shiftObject = colorPickerState.shift;
        if (!shiftObject) return; // Защита на всякий случай

        const globalColor = shiftObject.color || '#6c757d';
        dispatch(updateShiftColor({
            shiftId: shiftId,
            color: globalColor
        }));

        const resetShift = { ...shiftObject, color: globalColor };


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
        resetShiftColor: () => resetShiftColor(colorPickerState.shiftId),
        determineSaveMode
    };
};