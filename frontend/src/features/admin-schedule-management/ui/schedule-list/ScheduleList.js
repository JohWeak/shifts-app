// frontend/src/features/admin-schedule-management/ui/schedule-list/ScheduleList.js
import React, { useState, useMemo, useRef } from 'react';
import { Table, Card, Alert, Badge, Dropdown } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { format, parseISO, isAfter, startOfWeek, endOfWeek } from 'date-fns';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useMediaQuery } from 'shared/hooks/useMediaQuery';
import { useSortableData } from 'shared/hooks/useSortableData';
import SortableHeader from 'shared/ui/components/SortableHeader/SortableHeader';
import { deleteSchedule, updateScheduleStatus } from '../../model/scheduleSlice';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import './ScheduleList.css';

const ScheduleList = ({ schedules, onViewDetails, onScheduleDeleted }) => {
    const dispatch = useDispatch();
    const { t } = useI18n();

    const isMobile = useMediaQuery('(max-width: 768px)');

    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const [scheduleToPublish, setScheduleToPublish] = useState(null);
    const [scheduleToUnpublish, setScheduleToUnpublish] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showError, setShowError] = useState(null);

    // Split schedules into active and inactive
    const { activeSchedules, inactiveSchedules, currentWeekSchedule } = useMemo(() => {
        const today = new Date();
        const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
        const currentWeekEnd = endOfWeek(today, { weekStartsOn: 0 });

        const active = [];
        const inactive = [];
        let currentWeek = null;

        schedules.forEach(schedule => {
            if (!schedule.end_date) return;

            const endDate = parseISO(schedule.end_date);
            const startDate = parseISO(schedule.start_date);

            // Check if this is the current week schedule
            if (startDate <= currentWeekEnd && endDate >= currentWeekStart) {
                currentWeek = schedule;
            }

            // Split into active/inactive based on end date
            if (isAfter(endDate, today) || format(endDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
                active.push(schedule);
            } else {
                inactive.push(schedule);
            }
        });

        return {
            activeSchedules: active,
            inactiveSchedules: inactive,
            currentWeekSchedule: currentWeek
        };
    }, [schedules]);

    // Sort accessors for different fields
    const sortAccessors = useMemo(() => ({
        'week': (schedule) => schedule.start_date,
        'site': (schedule) => schedule.workSite?.site_name || '',
        'status': (schedule) => schedule.status,
        'updatedAt': (schedule) => schedule.updated_at || schedule.created_at,
    }), []);

    // Use sortable hook for active schedules
    const {
        sortedItems: sortedActiveSchedules,
        requestSort: requestActiveSort,
        sortConfig: activeSortConfig
    } = useSortableData(
        activeSchedules,
        { field: 'week', order: 'DESC' },
        sortAccessors
    );

    // Use sortable hook for inactive schedules
    const {
        sortedItems: sortedInactiveSchedules,
        requestSort: requestInactiveSort,
        sortConfig: inactiveSortConfig
    } = useSortableData(
        inactiveSchedules,
        { field: 'week', order: 'DESC' },
        sortAccessors
    );

    const formatScheduleDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
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
            setShowError(error.message || t('errors.publishFailed'));
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
            setShowError(error.message || t('errors.unpublishFailed'));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const isCurrentWeek = (schedule) => {
        return currentWeekSchedule && currentWeekSchedule.id === schedule.id;
    };

    const ActionButtons = ({ schedule }) => {
        const dropdownRef = useRef(null);
        const [dropdownStyle, setDropdownStyle] = useState({});

        const handleDropdownToggle = (isOpen) => {
            if (isOpen && dropdownRef.current) {
                const button = dropdownRef.current.querySelector('.action-dropdown-toggle');
                if (button) {
                    const rect = button.getBoundingClientRect();
                    setDropdownStyle({
                        position: 'fixed',
                        top: `${rect.bottom + 2}px`, // Small gap from button
                        left: `${rect.left - 100}px`, // Adjust for menu width
                        zIndex: 1055
                    });
                }
            }
        };

        return (
            <div className="schedule-actions" onClick={(e) => e.stopPropagation()}>
                <Dropdown
                    align="end"
                    ref={dropdownRef}
                    onToggle={handleDropdownToggle}
                >
                    <Dropdown.Toggle
                        variant="light"
                        size="sm"
                        className="action-dropdown-toggle"
                    >
                        <i className="bi bi-three-dots-vertical"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={dropdownStyle}>
                        <Dropdown.Item onClick={() => onViewDetails(schedule.id)}>
                            <i className="bi bi-eye me-2"></i>
                            {t('common.view')}
                        </Dropdown.Item>

                        {schedule.status === 'draft' && (
                            <>
                                <Dropdown.Item onClick={() => onViewDetails(schedule.id)}>
                                    <i className="bi bi-pencil me-2"></i>
                                    {t('common.edit')}
                                </Dropdown.Item>
                                <Dropdown.Item
                                    onClick={() => handlePublishClick(schedule)}
                                    className="text-success"
                                >
                                    <i className="bi bi-upload me-2"></i>
                                    {t('schedule.publish')}
                                </Dropdown.Item>
                            </>
                        )}

                        {schedule.status === 'published' && (
                            <Dropdown.Item
                                onClick={() => handleUnpublishClick(schedule)}
                                className="text-warning"
                            >
                                <i className="bi bi-pencil-square me-2"></i>
                                {t('schedule.unpublish')}
                            </Dropdown.Item>
                        )}

                        {canDeleteSchedule(schedule) && (
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    onClick={() => handleDeleteClick(schedule)}
                                    className="text-danger"
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    {t('common.delete')}
                                </Dropdown.Item>
                            </>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        );
    };

    const ScheduleTable = ({ schedules, sortConfig, requestSort, title, emptyMessage }) => (
        <Card className="schedule-list-card mb-4">
            <Card.Header className="schedule-list-header">
                <h5 className="mb-0">{title}</h5>
            </Card.Header>
            <Card.Body className="p-0">
                {schedules.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table hover className="schedule-overview-table mb-0">
                            <thead>
                            <tr>
                                <SortableHeader
                                    sortKey="week"
                                    sortConfig={sortConfig}
                                    onSort={requestSort}
                                >
                                    {t('schedule.weekPeriod')}
                                </SortableHeader>
                                <SortableHeader
                                    sortKey="site"
                                    sortConfig={sortConfig}
                                    onSort={requestSort}
                                >
                                    {t('schedule.site')}
                                </SortableHeader>
                                <SortableHeader
                                    sortKey="status"
                                    sortConfig={sortConfig}
                                    onSort={requestSort}
                                >
                                    {t('schedule.status')}
                                </SortableHeader>
                                <SortableHeader
                                    sortKey="updatedAt"
                                    sortConfig={sortConfig}
                                    onSort={requestSort}
                                >
                                    {t('common.lastUpdated')}
                                </SortableHeader>
                                <th className="text-center actions-header">
                                    {t('common.actions')}
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {schedules.map(schedule => (
                                <tr
                                    key={schedule.id}
                                    className={`schedule-row ${isCurrentWeek(schedule) ? 'current-week' : ''}`}
                                    onClick={() => onViewDetails(schedule.id)}
                                >
                                    <td className={isCurrentWeek(schedule) ? 'current-week-cell' : ''}>
                                        <div className="week-period-cell">
                                                <span className="date-range">
                                                    {formatScheduleDate(schedule.start_date)} - {formatScheduleDate(schedule.end_date)}
                                                </span>
                                            {isCurrentWeek(schedule) && (
                                                <Badge bg="info" className="ms-2 current-week-badge">
                                                    {t('schedule.currentWeek')}
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className={isCurrentWeek(schedule) ? 'current-week-cell' : ''}>
                                        {schedule.workSite?.site_name || 'N/A'}
                                    </td>
                                    <td className={isCurrentWeek(schedule) ? 'current-week-cell' : ''}>
                                        <StatusBadge status={schedule.status} />
                                    </td>
                                    <td className={isCurrentWeek(schedule) ? 'current-week-cell' : ''}>
                                            <span className="last-updated">
                                                {formatDateTime(schedule.updated_at || schedule.created_at)}
                                            </span>
                                    </td>
                                    <td className={`actions-cell ${isCurrentWeek(schedule) ? 'current-week-cell' : ''}`}>
                                        <ActionButtons schedule={schedule} />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card.Body>
        </Card>
    );

    return (
        <>
            {/* Active Schedules */}
            <ScheduleTable
                schedules={sortedActiveSchedules}
                sortConfig={activeSortConfig}
                requestSort={requestActiveSort}
                title={t('schedule.activeSchedules')}
                emptyMessage={t('schedule.noActiveSchedules')}
            />

            {/* Inactive Schedules */}
            {sortedInactiveSchedules.length > 0 && (
                <ScheduleTable
                    schedules={sortedInactiveSchedules}
                    sortConfig={inactiveSortConfig}
                    requestSort={requestInactiveSort}
                    title={t('schedule.inactiveSchedules')}
                    emptyMessage={t('schedule.noInactiveSchedules')}
                />
            )}

            {/* Confirmation Modals */}
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
                    <div className="schedule-info bg-danger bg-opacity-10 p-3 rounded">
                        <p><strong>{t('schedule.weekPeriod')}:</strong> {formatScheduleDate(scheduleToDelete.start_date)} - {formatScheduleDate(scheduleToDelete.end_date)}</p>
                        <p><strong>{t('schedule.site')}:</strong> {scheduleToDelete.workSite?.site_name || 'N/A'}</p>
                    </div>
                )}
            </ConfirmationModal>

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