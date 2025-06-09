// frontend/src/hooks/useScheduleState.js
import { useState } from 'react';
import { DEFAULT_GENERATION_SETTINGS } from '../constants/scheduleConstants';

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
    const [editingPositions, setEditingPositions] = useState(new Set());
    const [pendingChanges, setPendingChanges] = useState({});
    const [savingChanges, setSavingChanges] = useState(false);

    // Employee selection states
    const [selectedCell, setSelectedCell] = useState(null);
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
        setEditingPositions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(positionId)) {
                newSet.delete(positionId);
            } else {
                newSet.add(positionId);
            }
            return newSet;
        });
    };

    const removePendingChange = (changeKey) => {
        setPendingChanges(prev => {
            const newChanges = { ...prev };
            delete newChanges[changeKey];
            return newChanges;
        });
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
        setEditingPositions(new Set());
        setPendingChanges({});
    };

    const closeAllModals = () => {
        setShowGenerateModal(false);
        setShowComparisonModal(false);
        setShowEmployeeModal(false);
        setSelectedCell(null);
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
        pendingChanges,
        setPendingChanges,
        savingChanges,
        setSavingChanges,
        selectedCell,
        setSelectedCell,
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
        removePendingChange,
        clearPendingChangesForPosition,
        resetScheduleView,
        closeAllModals
    };
};

export default useScheduleState;