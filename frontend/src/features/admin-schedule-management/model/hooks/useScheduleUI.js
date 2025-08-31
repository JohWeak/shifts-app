import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

export const useScheduleUI = () => {
    const { editingPositions } = useSelector((state) => state.schedule);

    const [selectedCell, setSelectedCell] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1500);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const newIsLarge = window.innerWidth >= 1500;
            if (newIsLarge !== isLargeScreen) {
                setIsLargeScreen(newIsLarge);
                // If screen became small and panel was open - open modal
                if (!newIsLarge && isPanelOpen) {
                    setIsPanelOpen(false);
                    setShowEmployeeModal(true);
                }
                // If screen became large and modal was open - open panel
                if (newIsLarge && showEmployeeModal) {
                    setShowEmployeeModal(false);
                    setIsPanelOpen(true);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isLargeScreen, isPanelOpen, showEmployeeModal]);

    // Close panel if exited edit mode
    useEffect(() => {
        const isEditing = Object.values(editingPositions || {}).some(Boolean);
        if (!isEditing && isPanelOpen) {
            setIsPanelOpen(false);
            setSelectedCell(null);
        }
    }, [editingPositions, isPanelOpen]);

    useEffect(() => {
        if(isSaving && isPanelOpen){
            setIsPanelOpen(false);
            setSelectedCell(null);
            setIsSaving(false)
        }
    }, [isSaving, isPanelOpen]);

    const handleCellClick = (date, positionId, shiftId, employeeIdToReplace = null, assignmentIdToReplace = null) => {
        if (!editingPositions?.[positionId]) return;

        const cell = { date, positionId, shiftId, employeeIdToReplace, assignmentIdToReplace };
        setSelectedCell(cell);

        if (isLargeScreen) {
            setIsPanelOpen(true);
        } else {
            setShowEmployeeModal(true);
        }
    };

    const closeAllModals = () => {
        setIsPanelOpen(false);
        setShowEmployeeModal(false);
        setSelectedCell(null);
    };

    return {
        selectedCell,
        isPanelOpen,
        showEmployeeModal,
        isLargeScreen,
        handleCellClick,
        closeAllModals
    };
};