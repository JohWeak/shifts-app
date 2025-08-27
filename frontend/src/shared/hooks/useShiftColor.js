// frontend/src/shared/hooks/useShiftColor.js
import {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {setLocalShiftColorOverride} from '../../features/admin-schedule-management/model/scheduleSlice';
import ThemeColorService from 'shared/lib/services/ThemeColorService';
import {updateShiftColorInDB} from "../../features/admin-workplace-settings/model/workplaceSlice";

export const useShiftColor = () => {
    const dispatch = useDispatch();
    const {user} = useSelector(state => state.auth);


    const isAdmin = user?.role === 'admin';
    const [currentTheme, setCurrentTheme] = useState(
        document.documentElement.getAttribute('data-theme') || 'light'
    );
    const [colorPickerState, setColorPickerState] = useState({
        show: false,
        shiftId: null,
        positionId: null,
        currentColor: '#6c757d',
        originalColor: '#6c757d',
        saveMode: 'global',
        shift: null
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

        const displayedColor = ThemeColorService.getShiftColor(shift, currentTheme, user?.role);

        setColorPickerState({
            show: true,
            shiftId: shift.shift_id,
            positionId: shift.position_id,
            currentColor: displayedColor,
            originalColor: displayedColor,
            saveMode: mode,
            hasLocalColor: hasLocalColorForShift,
            shift: shift
        });
    };

    const closeColorPicker = () => {

        if (colorPickerState.shiftId) {
            setTempShiftColors(prev => {
                const newState = {...prev};
                delete newState[colorPickerState.shiftId];
                return newState;
            });
        }
        setColorPickerState({
            show: false,
            shiftId: null,
            positionId: null,
            currentColor: '#6c757d',
            originalColor: '#6c757d',
            shift: null
        });
    };

    const previewColor = (color) => {
        if (colorPickerState.shiftId) {
            setTempShiftColors(prev => ({
                ...prev,
                [colorPickerState.shiftId]: color
            }));
        }
    };

    const applyColor = async (color, customSaveMode = null) => {
        const {shiftId, positionId} = colorPickerState;
        const saveMode = customSaveMode || colorPickerState.saveMode;

        setTempShiftColors(prev => {
            const newState = {...prev};
            delete newState[shiftId];
            return newState;
        });

        if (saveMode === 'local') {
            ThemeColorService.setColor(shiftId, color, currentTheme, isAdmin && currentTheme === 'dark');
            dispatch(setLocalShiftColorOverride({shiftId, color}));
        } else { // saveMode === 'global'
            dispatch(updateShiftColorInDB({shiftId, color, positionId}));
        }
        closeColorPicker();
    };

    const getShiftColor = (shift) => {
        if (!shift) return '#6c757d';

        if (tempShiftColors[shift.shift_id]) {
            return tempShiftColors[shift.shift_id];
        }

        return ThemeColorService.getShiftColor(shift, currentTheme, user?.role);
    };

    const resetShiftColor = () => {
        const {shiftId, shift} = colorPickerState;
        if (!shift) return;

        ThemeColorService.removeColor(shiftId, currentTheme, isAdmin && currentTheme === 'dark');

        const globalColor = shift.color || '#6c757d';
        dispatch(setLocalShiftColorOverride({shiftId, color: globalColor}));

        closeColorPicker();
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