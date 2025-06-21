// frontend/src/features/admin-schedule-management/ui/schedule-table/ScheduleDetails.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Alert } from 'react-bootstrap';

import ScheduleEditor from './ScheduleEditor';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import ScheduleInfo from './ScheduleInfo';
import ScheduleActions from '../schedule-list/ScheduleActions';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

import './ScheduleDetails.css';

import {
    updateScheduleStatus,
    updateScheduleAssignments,
    exportSchedule,
    toggleEditPosition,
    addPendingChange,
    removePendingChange
} from '../../model/scheduleSlice';

const ScheduleDetails = ({ onCellClick }) => {
    const dispatch = useDispatch();
    const { t } = useI18n();

    const { scheduleDetails, editingPositions, pendingChanges, loading } = useSelector(state => state.schedule);

    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showUnpublishModal, setShowUnpublishModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportAlert, setExportAlert] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!scheduleDetails) {
        return <LoadingState size="lg" message={t('common.loading')} />;
    }

    const handleStatusUpdate = async (status) => {
        try {
            await dispatch(updateScheduleStatus({
                scheduleId: scheduleDetails.schedule.id,
                status
            })).unwrap();

            setShowPublishModal(false);
            setShowUnpublishModal(false);
        } catch (error) {
            console.error('Failed to update schedule status:', error);
        }
    };

    const handleExport = async (format) => {
        setIsExporting(true);
        setExportAlert(null);

        try {
            await dispatch(exportSchedule({
                scheduleId: scheduleDetails.schedule.id,
                format
            })).unwrap();

            setExportAlert({
                type: 'success',
                message: t('schedule.exportSuccess')
            });
        } catch (error) {
            setExportAlert({
                type: 'danger',
                message: t('common.errorOccurred')
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleSaveChanges = async (positionId) => {
        const positionChanges = Object.entries(pendingChanges)
            .filter(([key]) => key.startsWith(`${positionId}-`))
            .map(([, change]) => change);

        if (positionChanges.length === 0) return;

        setIsSaving(true);
        try {
            await dispatch(updateScheduleAssignments({
                scheduleId: scheduleDetails.schedule.id,
                assignments: positionChanges
            })).unwrap();

            positionChanges.forEach(change => {
                const key = `${change.pos_id}-${change.shift_id}-${change.work_date}`;
                dispatch(removePendingChange(key));
            });

            dispatch(toggleEditPosition(positionId));
        } catch (error) {
            console.error('Failed to save changes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEmployeeRemove = (date, positionId, shiftId, empId, assignmentId) => {
        const key = `${positionId}-${shiftId}-${date}`;
        dispatch(addPendingChange({
            key,
            change: {
                pos_id: positionId,
                shift_id: shiftId,
                work_date: date,
                emp_id: null,
                assignment_id: assignmentId
            }
        }));
    };

    const handleEmployeeClick = (date, positionId, shiftId, empId) => {
        const assignment = scheduleDetails?.assignments?.find(a =>
            (a.pos_id === positionId || a.position_id === positionId) &&
            a.emp_id === empId &&
            a.shift_id === shiftId &&
            (a.work_date === date || a.date === date)
        );

        onCellClick(date, positionId, shiftId, empId, assignment?.id);
    };

    const handleRemovePendingChange = (key) => {
        dispatch(removePendingChange(key));
    };

    return (
        <>
            <Card className="schedule-details-card">
                <Card.Body>
                    <div className="schedule-header-section">
                        <ScheduleInfo
                            schedule={scheduleDetails.schedule}
                            positions={scheduleDetails.positions}
                        />
                        <ScheduleActions
                            status={scheduleDetails.schedule.status}
                            onPublish={() => setShowPublishModal(true)}
                            onUnpublish={() => setShowUnpublishModal(true)}
                            onExport={handleExport}
                            isExporting={isExporting}
                        />
                    </div>

                    {exportAlert && (
                        <Alert
                            variant={exportAlert.type}
                            dismissible
                            onClose={() => setExportAlert(null)}
                            className="export-alert"
                        >
                            {exportAlert.message}
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            <Card className="positions-card">
                <Card.Body>
                    {scheduleDetails.positions?.length > 0 ? (
                        scheduleDetails.positions.map(position => (
                            <ScheduleEditor
                                key={position.pos_id}
                                position={position}
                                isEditing={!!editingPositions[position.pos_id]}
                                onToggleEdit={() => dispatch(toggleEditPosition(position.pos_id))}
                                onSaveChanges={() => handleSaveChanges(position.pos_id)}
                                onCancel={() => dispatch(toggleEditPosition(position.pos_id))}
                                onCellClick={onCellClick}
                                scheduleDetails={scheduleDetails}
                                pendingChanges={pendingChanges}
                                isSaving={isSaving}
                                onEmployeeClick={handleEmployeeClick}
                                onEmployeeRemove={handleEmployeeRemove}
                                onRemovePendingChange={handleRemovePendingChange}
                            />
                        ))
                    ) : (
                        <EmptyState
                            icon={<i className="bi bi-person-workspace fs-1"></i>}
                            title={t('position.noPositions')}
                            description="This schedule doesn't have any position assignments yet."
                        />
                    )}
                </Card.Body>
            </Card>

            <ConfirmationModal
                show={showPublishModal}
                onHide={() => setShowPublishModal(false)}
                onConfirm={() => handleStatusUpdate('published')}
                title={t('schedule.publishSchedule')}
                message={t('schedule.confirmPublish')}
                loading={loading === 'pending'}
            />

            <ConfirmationModal
                show={showUnpublishModal}
                onHide={() => setShowUnpublishModal(false)}
                onConfirm={() => handleStatusUpdate('draft')}
                title={t('schedule.unpublishEdit')}
                message={t('schedule.confirmUnpublish')}
                variant="warning"
                loading={loading === 'pending'}
            />
        </>
    );
};

export default ScheduleDetails;