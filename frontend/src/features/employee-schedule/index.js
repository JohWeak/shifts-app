// frontend/src/features/employee-schedule/index.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Container, Form } from 'react-bootstrap';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { fetchPositionSchedule } from 'features/employee-dashboard/model/employeeDataSlice';
import { useEmployeeDataAsAdmin } from 'features/admin-employee-management/model/hooks/useEmployeeDataAsAdmin';

import PageHeader from 'shared/ui/components/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal';
import PersonalScheduleView from './ui/PersonalScheduleView';
import FullScheduleView from './ui/FullScheduleView';
import { useRenderProtection } from 'shared/hooks/useRenderProtection';
import { useRenderTracker } from 'shared/hooks/useRenderTracker';
import { useThrottledEffect } from 'shared/hooks/useThrottledEffect';
import { useStableCallback } from 'shared/hooks/useStableRef';
import { useWhyDidYouUpdate } from 'shared/hooks/useWhyDidYouUpdate';

import { useShiftColor } from 'shared/hooks/useShiftColor';

import './index.css';

const EmployeeSchedule = ({ employeeId, hidePageHeader = false }) => {
    const { t, direction } = useI18n();
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();

    const {
        colorPickerState,
        openColorPicker,
        closeColorPicker,
        previewColor,
        applyColor,
        getShiftColor,
        currentTheme,
        hasLocalColor,
        resetShiftColor,
    } = useShiftColor();

    // Add render protection
    const { isBlocked: isRenderBlocked } = useRenderProtection('EmployeeSchedule');

    // Add render tracking for development
    const { setProps } = useRenderTracker('EmployeeSchedule');
    setProps({ employeeId, hidePageHeader });

    // Use admin hook when employeeId is provided, otherwise use regular selector
    const adminData = useEmployeeDataAsAdmin(employeeId);
    const regularEmployeeData = useSelector(state => state.employeeData);

    // Choose data source based on whether we're viewing as admin
    const isViewingAsAdmin = useMemo(() => !!employeeId, [employeeId]);
    const employeeData = useMemo(() =>
            isViewingAsAdmin ? adminData : regularEmployeeData,
        [isViewingAsAdmin, adminData, regularEmployeeData],
    );
    const {
        personalSchedule,
        personalScheduleLoading,
        personalScheduleError,
        positionSchedule,
        positionScheduleLoading,
        positionScheduleError,
    } = employeeData;
    // Extract stable reference to avoid dependency issues
    const loadPositionScheduleFunc = useStableCallback(adminData?.loadPositionSchedule);

    // Extract stable values to avoid dependency issues with complex objects
    const positionId = useMemo(() => personalSchedule?.current?.employee?.position_id, [personalSchedule]);
    const hasPersonalScheduleData = useMemo(() => !!personalSchedule?.current, [personalSchedule]);

    const [showFullSchedule, setShowFullSchedule] = useState(() => {
        const saved = localStorage.getItem('employee_showFullSchedule');
        return saved !== null ? JSON.parse(saved) : false;
    });
    // Diagnostic hook to find what's causing re-renders
    useWhyDidYouUpdate('EmployeeSchedule', {
        employeeId,
        hidePageHeader,
        adminData,
        regularEmployeeData,
        personalSchedule,
        positionSchedule,
        showFullSchedule,
        isViewingAsAdmin,
        loadPositionScheduleFunc,
        positionId,
    });

    // Add state to track the current employee for smooth transitions
    const [currentEmployeeId, setCurrentEmployeeId] = useState(employeeId);
    const [isTransitioning, setIsTransitioning] = useState(false);


    // Handle employee change transitions
    useEffect(() => {
        if (employeeId !== currentEmployeeId) {
            setIsTransitioning(true);
            // Short delay to allow for transition animation
            const timer = setTimeout(() => {
                setCurrentEmployeeId(employeeId);
                setIsTransitioning(false);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [employeeId, currentEmployeeId]);

    // Use throttled effect to prevent excessive API calls
    useThrottledEffect(() => {
        localStorage.setItem('employee_showFullSchedule', JSON.stringify(showFullSchedule));

        if (showFullSchedule && positionId) {
            if (isViewingAsAdmin && loadPositionScheduleFunc) {
                loadPositionScheduleFunc(positionId);
            } else if (!isViewingAsAdmin) {
                dispatch(fetchPositionSchedule({ positionId }));
            }
        }
    }, [dispatch, showFullSchedule, positionId, isViewingAsAdmin, loadPositionScheduleFunc], 200);

    const isLoading = useMemo(() =>
            showFullSchedule ? positionScheduleLoading : personalScheduleLoading,
        [showFullSchedule, positionScheduleLoading, personalScheduleLoading],
    );

    const error = useMemo(() =>
            showFullSchedule ? positionScheduleError : personalScheduleError,
        [showFullSchedule, positionScheduleError, personalScheduleError],
    );

    const scheduleData = useMemo(() =>
            showFullSchedule ? positionSchedule : personalSchedule,
        [showFullSchedule, positionSchedule, personalSchedule],
    );

    const employeeInfo = useMemo(() => personalSchedule?.current?.employee, [personalSchedule]);

    // Check for position from multiple sources for better UX
    const hasAssignedPosition = useMemo(() =>
            employeeInfo?.position_id ||
            personalSchedule?.current?.employee?.position_id ||
            (personalSchedule?.current?.schedule && personalSchedule.current.schedule.length > 0),
        [employeeInfo, personalSchedule],
    );

    const hasDataForCurrentWeek = useCallback((data) => {
        if (!data?.current) return false;
        if (showFullSchedule) {
            return data.current.days && data.current.days.length > 0;
        }
        return data.current.schedule && data.current.schedule.length > 0;
    }, [showFullSchedule]);

    const hasDataForNextWeek = useCallback((data) => {
        if (!data?.next) return false;
        if (showFullSchedule) {
            return data.next.days && data.next.days.length > 0;
        }
        return data.next.schedule && data.next.schedule.length > 0;
    }, [showFullSchedule]);

    const hasAnyData = useMemo(() =>
            hasDataForCurrentWeek(scheduleData) || hasDataForNextWeek(scheduleData),
        [hasDataForCurrentWeek, hasDataForNextWeek, scheduleData],
    );

    const renderContent = useCallback(() => {
        if (isLoading && !scheduleData) {
            return <LoadingState message={t('common.loading')} />;
        }
        if (error) {
            return <Alert variant="danger">{error}</Alert>;
        }
        if (showFullSchedule && !hasAssignedPosition) {
            return <EmptyState title={t('employee.schedule.positionRequired')} />;
        }
        if (!hasAnyData) {
            return <EmptyState title={t('employee.schedule.noSchedule')} />;
        }

        if (showFullSchedule) {
            return (
                <FullScheduleView
                    user={user}
                    scheduleData={scheduleData}
                    employeeData={employeeInfo}
                    getShiftColor={getShiftColor}
                    openColorPicker={openColorPicker}
                    showCurrentWeek={hasDataForCurrentWeek(scheduleData)}
                    showNextWeek={hasDataForNextWeek(scheduleData)}
                />
            );
        }

        return (
            <PersonalScheduleView
                scheduleData={scheduleData}
                employeeInfo={employeeInfo}
                getShiftColor={getShiftColor}
                openColorPicker={openColorPicker}
                showCurrentWeek={hasDataForCurrentWeek(scheduleData)}
                showNextWeek={hasDataForNextWeek(scheduleData)}
            />
        );
    }, [
        isLoading, scheduleData, error, showFullSchedule, hasAssignedPosition, hasAnyData,
        t, user, employeeInfo, getShiftColor, openColorPicker, hasDataForCurrentWeek, hasDataForNextWeek,
    ]);

    // Improved toggle visibility logic - show immediately for better UX, even during loading
    const shouldShowToggle = useMemo(() =>
            hasAssignedPosition && !isTransitioning && !error,
        [hasAssignedPosition, isTransitioning, error],
    );

    const handleToggleChange = useCallback((e) => {
        setShowFullSchedule(e.target.checked);
    }, []);

    const headerActions = useMemo(() => shouldShowToggle ? (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
        >
            <Form.Check
                type="switch"
                id="full-schedule-toggle"
                label={t('employee.schedule.fullView')}
                checked={showFullSchedule}
                onChange={handleToggleChange}
                className="full-schedule-toggle"
                reverse={direction === 'ltr'}
            />
        </motion.div>
    ) : null, [shouldShowToggle, t, showFullSchedule, handleToggleChange, direction]);

    // Show protection message if render is blocked
    if (isRenderBlocked) {
        return (
            <Container fluid className="employee-schedule-container">
                <div className="alert alert-warning text-center">
                    <h5>🛡️ Render Protection Active</h5>
                    <p>Schedule component was temporarily blocked to prevent infinite re-renders. Please wait...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="employee-schedule-container">
            {!hidePageHeader && (
                <PageHeader
                    icon="calendar-week-fill"
                    title={t('employee.schedule.title')}
                    subtitle={t('employee.schedule.subtitle')}
                    actions={
                        <AnimatePresence mode="wait">
                            {headerActions}
                        </AnimatePresence>
                    }
                />
            )}

            {/* Show toggle when PageHeader is hidden (admin view) */}
            <AnimatePresence mode="wait">
                {hidePageHeader && headerActions && (
                    <motion.div
                        key="admin-toggle"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="mb-3 d-flex justify-content-end"
                    >
                        {headerActions}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`content-${currentEmployeeId}-${showFullSchedule}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>

            <ColorPickerModal
                show={colorPickerState.show}
                onHide={closeColorPicker}
                onColorSelect={applyColor}
                onColorChange={previewColor}
                initialColor={colorPickerState.currentColor}
                title={t('modal.colorPicker.title')}
                saveMode={colorPickerState.saveMode}
                currentTheme={currentTheme}
                hasLocalColor={hasLocalColor}
                originalGlobalColor={colorPickerState.originalGlobalColor}
                onResetColor={resetShiftColor}
            />
        </Container>
    );
};

export default React.memo(EmployeeSchedule);