// frontend/src/features/admin-schedule-management/hooks/useShiftColor.js
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateShiftColor } from '../scheduleSlice';
import { updatePositionShiftColor } from 'shared/api/apiService';

export const useShiftColor = () => {
    const dispatch = useDispatch();

    // Состояние для color picker
    const [colorPickerState, setColorPickerState] = useState({
        show: false,
        shiftId: null,
        currentColor: '#6c757d',
        originalColor: '#6c757d'
    });

    // Временное состояние для предпросмотра
    const [tempShiftColors, setTempShiftColors] = useState({});

    const openColorPicker = (shiftId, currentColor) => {
        setColorPickerState({
            show: true,
            shiftId: shiftId,
            currentColor: currentColor || '#6c757d',
            originalColor: currentColor || '#6c757d'
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

    const applyColor = async (color) => {
        try {
            // Обновляем в Redux сразу
            dispatch(updateShiftColor({
                shiftId: colorPickerState.shiftId,
                color: color
            }));

            // Очищаем временный цвет
            setTempShiftColors(prev => {
                const newState = { ...prev };
                delete newState[colorPickerState.shiftId];
                return newState;
            });

            // Отправляем на сервер
            await updatePositionShiftColor(colorPickerState.shiftId, color);

            return true;
        } catch (error) {
            console.error('Error updating shift color:', error);
            // Можно добавить toast notification
            return false;
        }
    };

    const getShiftColor = (shift) => {
        return tempShiftColors[shift.shift_id] || shift.color;
    };

    return {
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor
    };
};