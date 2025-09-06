// frontend/src/shared/hooks/useShiftColor.js
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLocalShiftColorOverride } from '../../features/admin-schedule-management/model/scheduleSlice';
import ThemeColorService from 'shared/lib/services/ThemeColorService';
import { updateShiftColorInDB } from '../../features/admin-workplace-settings/model/workplaceSlice';

export const useShiftColor = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const scheduleDetails = useSelector(state => state.schedule.scheduleDetails);


    const isAdmin = user?.role === 'admin';
    const [currentTheme, setCurrentTheme] = useState(
        document.documentElement.getAttribute('data-theme') || 'light',
    );
    const [colorPickerState, setColorPickerState] = useState({
        show: false,
        shiftId: null,
        positionId: null,
        currentColor: '#6c757d',
        originalColor: '#6c757d',
        saveMode: 'global',
        shift: null,
    });


    const [tempShiftColors, setTempShiftColors] = useState({});

    // Track global changes that are waiting for server response
    // Load from sessionStorage on init to persist across page navigations
    const [pendingGlobalChanges, setPendingGlobalChanges] = useState(() => {
        try {
            const saved = sessionStorage.getItem('pendingGlobalColorChanges');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    setCurrentTheme(newTheme);
                    setTempShiftColors({});

                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => observer.disconnect();
    }, []);  // Remove unstable dependencies

    // Save pendingGlobalChanges to sessionStorage whenever it changes
    useEffect(() => {
        try {
            if (Object.keys(pendingGlobalChanges).length > 0) {
                sessionStorage.setItem('pendingGlobalColorChanges', JSON.stringify(pendingGlobalChanges));
            } else {
                sessionStorage.removeItem('pendingGlobalColorChanges');
            }
        } catch {
            // Ignore sessionStorage errors
        }
    }, [pendingGlobalChanges]);

    // Create stable reference for shifts to prevent unnecessary effects
    const shiftsRef = useMemo(() => scheduleDetails?.shifts, [JSON.stringify(scheduleDetails?.shifts)]);
    
    // Clean up temp colors and pending changes when Redux store updates with new shift colors
    useEffect(() => {
        if (shiftsRef && (Object.keys(tempShiftColors).length > 0 || Object.keys(pendingGlobalChanges).length > 0)) {
            setTempShiftColors(prev => {
                const newTempColors = { ...prev };
                let hasChanges = false;

                // Only clean up temp colors for global saves in light theme
                // Don't interfere with local color system
                Object.keys(newTempColors).forEach(shiftId => {
                    const shift = shiftsRef.find(s => s.shift_id === parseInt(shiftId));
                    if (shift && shift.color === newTempColors[shiftId]) {
                        // Only clear if this was likely a global save (in light theme for admin)
                        if (isAdmin && currentTheme === 'light') {
                            delete newTempColors[shiftId];
                            hasChanges = true;
                        }
                    }
                });

                return hasChanges ? newTempColors : prev;
            });

            // Clean up pending global changes when Redux is updated
            setPendingGlobalChanges(prev => {
                const newPendingChanges = { ...prev };
                let hasChanges = false;

                Object.keys(newPendingChanges).forEach(shiftId => {
                    const shift = shiftsRef.find(s => s.shift_id === parseInt(shiftId));
                    if (shift && shift.color === newPendingChanges[shiftId]) {
                        delete newPendingChanges[shiftId];
                        hasChanges = true;
                    }
                });

                return hasChanges ? newPendingChanges : prev;
            });
        }
    }, [shiftsRef, isAdmin, currentTheme]);  // Remove unstable dependencies

    const getShiftColor = (shift) => {
        if (!shift) return '#6c757d';

        // Use temp colors for preview - but only during color picker session
        if (tempShiftColors[shift.shift_id] && colorPickerState.show && colorPickerState.shiftId === shift.shift_id) {
            return tempShiftColors[shift.shift_id];
        }

        // Also use temp colors briefly after global save (until Redux updates) 
        // but only in light theme and only for the shift that was just saved
        if (tempShiftColors[shift.shift_id] && isAdmin && currentTheme === 'light' && !colorPickerState.show) {
            return tempShiftColors[shift.shift_id];
        }

        // Use pending global changes for light theme (preserves global changes across theme switches)
        if (pendingGlobalChanges[shift.shift_id] && isAdmin && currentTheme === 'light') {
            return pendingGlobalChanges[shift.shift_id];
        }

        return ThemeColorService.getShiftColor(shift, currentTheme, user?.role);
    };

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

        // Use our own getShiftColor function that handles pendingGlobalChanges
        const displayedColor = getShiftColor(shift);

        setColorPickerState({
            show: true,
            shiftId: shift.shift_id,
            positionId: shift.position_id,
            currentColor: displayedColor,
            originalColor: displayedColor,
            saveMode: mode,
            hasLocalColor: hasLocalColorForShift,
            shift: shift,
        });
    };

    const closeColorPicker = () => {
        setColorPickerState({
            show: false,
            shiftId: null,
            positionId: null,
            currentColor: '#6c757d',
            originalColor: '#6c757d',
            shift: null,
        });
    };

    const cancelColorChange = useCallback(() => {
        // Reset temp color to original when canceling
        if (colorPickerState.shiftId) {
            setTempShiftColors(prev => {
                const newState = { ...prev };
                delete newState[colorPickerState.shiftId];
                return newState;
            });
        }
    }, [colorPickerState.shiftId]);

    const previewColor = useCallback((color) => {
        setTempShiftColors(prev => ({
            ...prev,
            [colorPickerState.shiftId]: color,
        }));
    }, [colorPickerState.shiftId, setTempShiftColors]);

    const applyColor = async (color, customSaveMode = null) => {
        const { shiftId, positionId } = colorPickerState;
        const saveMode = customSaveMode || colorPickerState.saveMode;

        if (saveMode === 'local') {
            ThemeColorService.setColor(shiftId, color, currentTheme, isAdmin && currentTheme === 'dark');

            // For local saves, remove temp color immediately
            setTempShiftColors(prev => {
                const newState = { ...prev };
                delete newState[shiftId];
                return newState;
            });
        } else { // saveMode === 'global'
            // Store the pending global change
            setPendingGlobalChanges(prev => ({
                ...prev,
                [shiftId]: color,
            }));

            dispatch(updateShiftColorInDB({ shiftId, color, positionId }));
            // For global saves, keep temp color until Redux state updates
        }
        closeColorPicker();
    };

    const resetShiftColor = () => {
        const { shiftId, shift, saveMode } = colorPickerState;
        if (!shift) return;

        ThemeColorService.removeColor(shiftId, currentTheme, isAdmin && currentTheme === 'dark');

        // Only affect Redux if we're in global mode or resetting from local back to global
        if (saveMode === 'global' || (saveMode === 'local' && currentTheme === 'light')) {
            const globalColor = shift.color || '#6c757d';
            dispatch(setLocalShiftColorOverride({ shiftId, color: globalColor }));
        }

        closeColorPicker();
    };

    // Memoize the returned object to prevent unnecessary re-renders
    return useMemo(() => ({
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
        determineSaveMode,
        cancelColorChange,
    }), [
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor,
        currentTheme,
        user?.role,
        isAdmin,
        determineSaveMode,
        cancelColorChange,
    ]);
};