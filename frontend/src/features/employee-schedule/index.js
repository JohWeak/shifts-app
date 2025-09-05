// frontend/src/features/employee-schedule/index.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Container, Form } from 'react-bootstrap';
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
    const hasAssignedPosition = employeeInfo?.position_id || false;

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

    const shouldShowToggle = hasAssignedPosition && hasAnyData && !isLoading && !error;

    const headerActions = shouldShowToggle ? (
        <Form.Check
            type="switch"
            id="full-schedule-toggle"
            label={t('employee.schedule.fullView')}
            checked={showFullSchedule}
            onChange={(e) => setShowFullSchedule(e.target.checked)}
            className="full-schedule-toggle"
            reverse={direction === 'ltr'}
        />
    ) : null;

    return (
        <Container fluid className="employee-schedule-container">
            {!hidePageHeader && (
                <PageHeader
                    icon="calendar-week-fill"
                    title={t('employee.schedule.title')}
                    subtitle={t('employee.schedule.subtitle')}
                    actions={headerActions}
                />
            )}

            {/* Show toggle when PageHeader is hidden (admin view) */}
            {hidePageHeader && headerActions && (
                <div className="mb-3 d-flex justify-content-end">
                    {headerActions}
                </div>
            )}

            {renderContent()}

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