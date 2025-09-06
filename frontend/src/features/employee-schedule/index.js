// frontend/src/features/employee-schedule/index.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Container, Form } from 'react-bootstrap';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { fetchPositionSchedule } from 'features/employee-dashboard/model/employeeDataSlice';
import { useEmployeeDataAsAdmin } from 'features/employee-dashboard/model/hooks/useEmployeeDataAsAdmin';

import PageHeader from 'shared/ui/components/PageHeader';
import LoadingState from 'shared/ui/components/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState';
import ColorPickerModal from 'shared/ui/components/ColorPickerModal';
import PersonalScheduleView from './ui/PersonalScheduleView';
import FullScheduleView from './ui/FullScheduleView';

import { useShiftColor } from 'shared/hooks/useShiftColor';

import './index.css';

const EmployeeSchedule = ({ employeeId, hidePageHeader = false }) => {
    const { t, direction } = useI18n();
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();

    // Use admin hook when employeeId is provided, otherwise use regular selector
    const adminData = useEmployeeDataAsAdmin(employeeId);
    const regularEmployeeData = useSelector(state => state.employeeData);

    // Choose data source based on whether we're viewing as admin
    const isViewingAsAdmin = !!employeeId;
    const employeeData = isViewingAsAdmin ? adminData : regularEmployeeData;

    // Add state to track the current employee for smooth transitions
    const [currentEmployeeId, setCurrentEmployeeId] = useState(employeeId);
    const [isTransitioning, setIsTransitioning] = useState(false);


    const [showFullSchedule, setShowFullSchedule] = useState(() => {
        const saved = localStorage.getItem('employee_showFullSchedule');
        return saved !== null ? JSON.parse(saved) : false;
    });

    const {
        personalSchedule,
        personalScheduleLoading,
        personalScheduleError,
        positionSchedule,
        positionScheduleLoading,
        positionScheduleError,
    } = employeeData;


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

    useEffect(() => {
        localStorage.setItem('employee_showFullSchedule', JSON.stringify(showFullSchedule));

        if (showFullSchedule && personalSchedule?.current?.employee?.position_id) {
            const positionId = personalSchedule.current.employee.position_id;
            dispatch(fetchPositionSchedule({ positionId }));
        }

    }, [dispatch, showFullSchedule, personalSchedule]);

    const isLoading = showFullSchedule ? positionScheduleLoading : personalScheduleLoading;
    const error = showFullSchedule ? positionScheduleError : personalScheduleError;
    const scheduleData = showFullSchedule ? positionSchedule : personalSchedule;

    const employeeInfo = personalSchedule?.current?.employee;
    // Check for position from multiple sources for better UX
    const hasAssignedPosition = employeeInfo?.position_id ||
        personalSchedule?.current?.employee?.position_id ||
        (personalSchedule?.current?.schedule && personalSchedule.current.schedule.length > 0);

    const hasDataForCurrentWeek = (data) => {
        if (!data?.current) return false;
        if (showFullSchedule) {
            return data.current.days && data.current.days.length > 0;
        }
        return data.current.schedule && data.current.schedule.length > 0;
    };

    const hasDataForNextWeek = (data) => {
        if (!data?.next) return false;
        if (showFullSchedule) {
            return data.next.days && data.next.days.length > 0;
        }
        return data.next.schedule && data.next.schedule.length > 0;
    };

    const hasAnyData = hasDataForCurrentWeek(scheduleData) || hasDataForNextWeek(scheduleData);

    const renderContent = () => {
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
    };

    // Improved toggle visibility logic - show immediately for better UX, even during loading
    const shouldShowToggle = hasAssignedPosition && !isTransitioning && !error;

    const headerActions = shouldShowToggle ? (
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
                onChange={(e) => setShowFullSchedule(e.target.checked)}
                className="full-schedule-toggle"
                reverse={direction === 'ltr'}
            />
        </motion.div>
    ) : null;

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

export default EmployeeSchedule;