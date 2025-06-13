// frontend/src/hooks/useScheduleState.js
import { useState } from 'react';
import { DEFAULT_GENERATION_SETTINGS } from '../../config/scheduleConstants';

export const useScheduleState = () => {
    // Main data states
    const [schedules, setSchedules] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [scheduleDetails, setScheduleDetails] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Modal states
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);

    // Operation states
    const [generating, setGenerating] = useState(false);
    const [comparing, setComparing] = useState(false);

    // Edit mode states
    const [editingPositions, setEditingPositions] = useState({});
    const [pendingChanges, setPendingChanges] = useState({});
    const [savingChanges, setSavingChanges] = useState(false);

    // Employee selection states
    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recommendations, setRecommendations] = useState(null);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    // Comparison results
    const [comparisonResults, setComparisonResults] = useState(null);

    // Generation settings
    const [generateSettings, setGenerateSettings] = useState(DEFAULT_GENERATION_SETTINGS);

    // Alert state
    const [alert, setAlert] = useState(null);

    // Helper functions
    const clearAlert = () => setAlert(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });
    };

    const toggleEditPosition = (positionId) => {
        console.log('toggleEditPosition called with:', positionId);
        console.log('Current editingPositions:', editingPositions);

        setEditingPositions(prev => {
            const newState = {
                ...prev,
                [positionId]: !prev[positionId]
            };
            console.log('New editingPositions state:', newState);
            return newState;
        });
    };

    // NEW: Functions for managing editing positions with date-position-shift keys (for cell editing)
    const [editingCells, setEditingCells] = useState(new Set());

    const startEditingCell = (date, positionId, shiftId) => {
        const key = `${date}-${positionId}-${shiftId}`;
        setEditingCells(prev => new Set([...prev, key]));
    };

    const stopEditingCell = (date, positionId, shiftId) => {
        const key = `${date}-${positionId}-${shiftId}`;
        setEditingCells(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
        });
    };

    const isCellEditing = (date, positionId, shiftId) => {
        const key = `${date}-${positionId}-${shiftId}`;
        return editingCells.has(key);
    };

    const removePendingChange = (changeKey) => {
        setPendingChanges(prev => {
            const newChanges = { ...prev };
            delete newChanges[changeKey];
            return newChanges;
        });
    };

    // ИСПРАВЛЕНО: Функция для получения pending changes для конкретной позиции
    const getPendingChangesForPosition = (positionId) => {
        const positionChanges = {};
        Object.keys(pendingChanges).forEach(key => {
            if (pendingChanges[key].positionId === positionId) {
                positionChanges[key] = pendingChanges[key];
            }
        });
        return positionChanges;
    };

    const clearPendingChangesForPosition = (positionId) => {
        setPendingChanges(prev => {
            const newChanges = { ...prev };
            Object.keys(newChanges).forEach(key => {
                if (newChanges[key].positionId === positionId) {
                    delete newChanges[key];
                }
            });
            return newChanges;
        });
    };

    const resetScheduleView = () => {
        setSelectedSchedule(null);
        setScheduleDetails(null);
        setActiveTab('overview');
        setEditingPositions({});
        setEditingCells(new Set());
        setPendingChanges({});
    };

    const closeAllModals = () => {
        setShowGenerateModal(false);
        setShowComparisonModal(false);
        setShowEmployeeModal(false);
        setIsModalOpen(false);
        setSelectedCell(null);
        setSelectedPosition(null);
    };

    return {
        // State
        schedules,
        setSchedules,
        selectedSchedule,
        setSelectedSchedule,
        scheduleDetails,
        setScheduleDetails,
        activeTab,
        setActiveTab,
        showGenerateModal,
        setShowGenerateModal,
        showComparisonModal,
        setShowComparisonModal,
        showEmployeeModal,
        setShowEmployeeModal,
        generating,
        setGenerating,
        comparing,
        setComparing,
        editingPositions,
        setEditingPositions,
        editingCells,
        setEditingCells,
        pendingChanges,
        setPendingChanges,
        savingChanges,
        setSavingChanges,
        selectedCell,
        setSelectedCell,
        selectedPosition,
        setSelectedPosition,
        isModalOpen,
        setIsModalOpen,
        recommendations,
        setRecommendations,
        loadingRecommendations,
        setLoadingRecommendations,
        comparisonResults,
        setComparisonResults,
        generateSettings,
        setGenerateSettings,
        alert,
        setAlert,

        // Helper functions
        clearAlert,
        showAlert,
        toggleEditPosition,
        startEditingCell,
        stopEditingCell,
        isCellEditing,
        removePendingChange,
        getPendingChangesForPosition,
        clearPendingChangesForPosition,
        resetScheduleView,
        closeAllModals
    };
};

export default useScheduleState;