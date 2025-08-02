// frontend/src/features/admin-schedule-management/components/ScheduleList.js
import React, { useState } from 'react';
import { Table, Card, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useMediaQuery } from 'shared/hooks/useMediaQuery';
import { deleteSchedule, updateScheduleStatus } from '../../model/scheduleSlice';
import ActionButtons from 'shared/ui/components/ActionButtons/ActionButtons';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import './ScheduleList.css';

const ScheduleList = ({ schedules, onViewDetails, onScheduleDeleted,  }) => {
    const dispatch = useDispatch();
    const { t } = useI18n();

    const isMobile = useMediaQuery('(max-width: 768px)');


    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const [scheduleToPublish, setScheduleToPublish] = useState(null);
    const [scheduleToUnpublish, setScheduleToUnpublish] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showError, setShowError] = useState(null);


    const formatScheduleDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const canDeleteSchedule = (schedule) => {
        return ['draft', 'unpublished'].includes(schedule.status?.toLowerCase());
    };

    const handleDeleteClick = (schedule) => {
        setScheduleToDelete(schedule);
    };

    const handleDeleteConfirm = async () => {
        if (!scheduleToDelete) return;

        setIsDeleting(true);
        setShowError(null);

        try {
            await dispatch(deleteSchedule(scheduleToDelete.id)).unwrap();
            setScheduleToDelete(null);
            if (onScheduleDeleted) {
                onScheduleDeleted(scheduleToDelete.id);
            }
        } catch (error) {
            setShowError(error.message || t('errors.deleteFailed'));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setScheduleToDelete(null);
        setShowError(null);
    };

    const handlePublishClick = (schedule) => {
        setScheduleToPublish(schedule);
    };

    const handleUnpublishClick = (schedule) => {
        setScheduleToUnpublish(schedule);
    };

    const handlePublishConfirm = async () => {
        if (!scheduleToPublish) return;

        setIsUpdatingStatus(true);
        setShowError(null);

        try {
            await dispatch(updateScheduleStatus({
                scheduleId: scheduleToPublish.id,
                status: 'published'
            })).unwrap();
            setScheduleToPublish(null);
        } catch (error) {
            setShowError(error.message || t('errors.updateFailed'));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleUnpublishConfirm = async () => {
        if (!scheduleToUnpublish) return;

        setIsUpdatingStatus(true);
        setShowError(null);

        try {
            await dispatch(updateScheduleStatus({
                scheduleId: scheduleToUnpublish.id,
                status: 'draft'
            })).unwrap();
            setScheduleToUnpublish(null);
        } catch (error) {
            setShowError(error.message || t('errors.updateFailed'));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleRowClick = (scheduleId) => {
        onViewDetails(scheduleId);
    };

    const getScheduleActions = (schedule) => {
        const actions = [];

        // Add delete action
        actions.push({
            label: isMobile ? '' : t('common.delete'),
            icon: 'bi bi-trash',
            onClick: () => handleDeleteClick(schedule),
            disabled: !canDeleteSchedule(schedule),
            variant: 'danger',
            title: t('common.delete')

        });
        // Add publish/unpublish action based on current status
        if (schedule.status === 'draft') {
            actions.push({
                label: t('schedule.publish'),
                icon: 'bi bi-upload',
                onClick: () => handlePublishClick(schedule),
                variant: 'success',
                title: t('schedule.publish')

            });
        } else if (schedule.status === 'published') {
            actions.push({
                label: t('schedule.unpublish'),
                icon: 'bi bi-pencil-square',
                onClick: () => handleUnpublishClick(schedule),
                variant: 'warning',
                title: t('schedule.unpublish')

            });
        }



        return actions;
    };


    if (!schedules || schedules.length === 0) {
        return (
            <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                {t('schedule.noSchedules')}
            </Alert>
        );
    }

    const schedulesList = Array.isArray(schedules) ? schedules : [];

    return (
        <>
            <Card>
                <Card.Body>
                    <Table responsive className="schedule-overview-table">
                        <thead>
                        <tr>
                            <th>{t('schedule.weekPeriod')}</th>
                            <th>{t('schedule.status')}</th>
                            <th>{t('schedule.site')}</th>
                            <th>{t('schedule.created')}</th>
                            <th>{t('schedule.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {schedulesList.map(schedule => (
                            <tr
                                key={schedule.id}
                                className="schedule-row"
                                onClick={(e) => {
                                    // Prevent click when clicking on actions column
                                    if (!e.target.closest('.action-buttons')) {
                                        handleRowClick(schedule.id);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>{formatScheduleDate(schedule.start_date)} - {formatScheduleDate(schedule.end_date)}</td>
                                <td>
                                    <StatusBadge
                                    status={schedule.status}
                                    mode={isMobile ? 'icon' : 'text'}
                                />
                                </td>
                                <td>{schedule.workSite?.site_name || 'N/A'}</td>
                                <td>{formatScheduleDate(schedule.createdAt)}</td>
                                <td className="action-buttons">
                                    <ActionButtons
                                        actions={getScheduleActions(schedule)}
                                        size="sm"
                                    />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <ConfirmationModal
                show={!!scheduleToDelete}
                title={t('schedule.deleteSchedule')}
                message={t('schedule.confirmDelete')}
                onConfirm={handleDeleteConfirm}
                onHide={handleDeleteCancel}
                loading={isDeleting}
                confirmText={t('schedule.deleteSchedule')}
                variant="danger"
            >
                {scheduleToDelete && (
                    <div className="schedule-info bg-light p-3 rounded">
                        <p><strong>{t('schedule.weekPeriod')}:</strong> {formatScheduleDate(scheduleToDelete.start_date)} - {formatScheduleDate(scheduleToDelete.end_date)}</p>
                        <p><strong>{t('schedule.site')}:</strong> {scheduleToDelete.workSite?.site_name || 'N/A'}</p>
                    </div>
                )}
            </ConfirmationModal>

            {/* Publish Confirmation Modal */}
            <ConfirmationModal
                show={!!scheduleToPublish}
                title={t('schedule.publishSchedule')}
                message={t('schedule.confirmPublish')}
                onConfirm={handlePublishConfirm}
                onCancel={() => setScheduleToPublish(null)}
                loading={isUpdatingStatus}
                confirmText={t('schedule.publishSchedule')}
                variant="success"
            />

            {/* Unpublish Confirmation Modal */}
            <ConfirmationModal
                show={!!scheduleToUnpublish}
                title={t('schedule.unpublishEdit')}
                message={t('schedule.confirmUnpublish')}
                onConfirm={handleUnpublishConfirm}
                onCancel={() => setScheduleToUnpublish(null)}
                loading={isUpdatingStatus}
                confirmText={t('schedule.unpublishEdit')}
                variant="warning"
            />

            {/* Error Alert */}
            {showError && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setShowError(null)}
                    className="mt-3"
                >
                    {showError}
                </Alert>
            )}
        </>
    );
};

export default ScheduleList;