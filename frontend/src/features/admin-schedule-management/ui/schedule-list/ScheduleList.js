// frontend/src/features/admin-schedule-management/ui/schedule-list/ScheduleList.js
import React, {useState, useMemo, useRef, useEffect} from 'react';
import {Table, Card, Alert, Badge} from 'react-bootstrap';
import {useDispatch} from 'react-redux';
import {format, parseISO, isAfter, startOfWeek, endOfWeek} from 'date-fns';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {useMediaQuery} from 'shared/hooks/useMediaQuery';
import {useSortableData} from 'shared/hooks/useSortableData';
import SortableHeader from 'shared/ui/components/SortableHeader/SortableHeader';
import {deleteSchedule, updateScheduleStatus} from '../../model/scheduleSlice';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import {
    formatScheduleDate,
    canDeleteSchedule,
    formatDateTime,
    formatFullDate,
    formatWeekRange
} from "shared/lib/utils/scheduleUtils";
import ScheduleActionButtons from '../ActionButtons/ScheduleActionButtons';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import './ScheduleList.css';

const ScheduleList = ({schedules, onViewDetails, onScheduleDeleted}) => {
    const dispatch = useDispatch();
    const {t, locale} = useI18n();

    const isMobile = useMediaQuery('(max-width: 768px)');

    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const [scheduleToPublish, setScheduleToPublish] = useState(null);
    const [scheduleToUnpublish, setScheduleToUnpublish] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showError, setShowError] = useState(null);
    const [openStates, setOpenStates] = useState(() => {
        const savedStates = localStorage.getItem('schedulesOpenStates');
        const defaultStates = {
            active: true,
            inactive: true
        };
        return savedStates ? { ...defaultStates, ...JSON.parse(savedStates) } : defaultStates;
    });

    // 2. useEffect сохраняет весь объект
    useEffect(() => {
        localStorage.setItem('schedulesOpenStates', JSON.stringify(openStates));
    }, [openStates]);

    const handleToggle = (key) => {
        setOpenStates(prevStates => ({
            ...prevStates,
            [key]: !prevStates[key] // динамический ключ для обновления свойства
        }));
    };

    // Split schedules into active and inactive
    const {activeSchedules, inactiveSchedules, currentWeekScheduleIds} = useMemo(() => {
        const today = new Date();
        const currentWeekStart = startOfWeek(today, {weekStartsOn: 0});
        const currentWeekEnd = endOfWeek(today, {weekStartsOn: 0});

        const active = [];
        const inactive = [];
        const currentWeek = [];

        schedules.forEach(schedule => {
            if (!schedule.end_date) return;

            const endDate = parseISO(schedule.end_date);
            const startDate = parseISO(schedule.start_date);

            // Check if this is the current week schedule
            if (startDate <= currentWeekEnd && endDate >= currentWeekStart) {
                currentWeek.push(schedule);
            }

            // Split into active/inactive based on end date
            if (isAfter(endDate, today) || format(endDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
                active.push(schedule);
            } else {
                inactive.push(schedule);
            }
        });
        const currentWeekScheduleIds = new Set(currentWeek.map(s => s.id));
        return {
            activeSchedules: active,
            inactiveSchedules: inactive,
            currentWeekScheduleIds: currentWeekScheduleIds
        };
    }, [schedules]);

    // Sort accessors for different fields
    const sortAccessors = useMemo(() => ({
        'week': (schedule) => schedule.start_date,
        'site': (schedule) => schedule.workSite?.site_name || '',
        'status': (schedule) => schedule.status,
        'updatedAt': (schedule) => schedule.updatedAt || schedule.createdAt,
    }), []);

    // Use sortable hook for active schedules
    const {
        sortedItems: sortedActiveSchedules,
        requestSort: requestActiveSort,
        sortConfig: activeSortConfig
    } = useSortableData(
        activeSchedules,
        {field: 'week', order: 'ASC'},
        sortAccessors
    );

    // Use sortable hook for inactive schedules
    const {
        sortedItems: sortedInactiveSchedules,
        requestSort: requestInactiveSort,
        sortConfig: inactiveSortConfig
    } = useSortableData(
        inactiveSchedules,
        {field: 'week', order: 'DESC'},
        sortAccessors
    );


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


    const ScheduleTable = ({
                               schedules,
                               sortConfig,
                               requestSort,
                               title,
                               emptyMessage,
                               currentWeekScheduleIds,
                               className = '',
                               isCollapsible = false,
                               isOpen = true,
                               onToggle = () => {
                               }
                           }) => (
        <Card className="schedule-list-card mb-4">
            <Card.Header
                className={`schedule-list-header ${className} ${isCollapsible ? 'collapsible' : ''} ${!isOpen ? 'closed' : ''}`}
                onClick={onToggle}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{title}</h5>
                    {isCollapsible && (
                        <i className={`bi bi-chevron-down accordion-icon ${!isOpen ? 'closed' : ''}`}></i>
                    )}
                </div>
            </Card.Header>
            {isOpen && (
                <Card.Body className="p-0">
                    {schedules.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            {emptyMessage}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table className="schedule-overview-table mb-0">
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
                                        sortKey="updatedAt"
                                        sortConfig={sortConfig}
                                        onSort={requestSort}
                                    >
                                        {t('common.lastUpdated')}
                                    </SortableHeader>
                                    <SortableHeader
                                        sortKey="status"
                                        sortConfig={sortConfig}
                                        onSort={requestSort}
                                    >
                                        {t('schedule.status')}
                                    </SortableHeader>

                                    <th className="text-center actions-header">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {schedules.map(schedule => {
                                    const isCurrent = currentWeekScheduleIds.has(schedule.id);
                                    return (
                                        <tr
                                            key={schedule.id}
                                            className={`schedule-row ${isCurrent ? 'current-week' : ''}`}
                                            onClick={() => onViewDetails(schedule.id)}
                                        >
                                            <td className={isCurrent ? 'current-week-cell' : ''}>
                                                <div className="week-period-cell date-range">
                                                    {formatWeekRange(schedule.start_date, locale)}
                                                    <div className="date-range">
                                                    </div>
                                                    {isCurrent && (
                                                        <Badge bg="info" className="ms-2 current-week-badge">
                                                            {t('schedule.currentWeek')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={isCurrent ? 'current-week-cell' : ''}>
                                            <span className="site-name">
                                                {schedule.workSite?.site_name || 'N/A'}
                                            </span>
                                            </td>
                                            <td className={isCurrent ? 'current-week-cell' : ''}>
                                            <span className="last-updated">
                                                {formatDateTime(schedule.updatedAt || schedule.createdAt, locale)}
                                            </span>
                                            </td>
                                            <td className={isCurrent ? 'current-week-cell' : ''}>
                                                <StatusBadge status={schedule.status}/>
                                            </td>
                                            <td className={`actions-cell ${isCurrent ? 'current-week-cell' : ''}`}>
                                                <ScheduleActionButtons
                                                    schedule={schedule}
                                                    variant="dropdown"
                                                    onView={() => onViewDetails(schedule.id)}
                                                    onPublish={() => handlePublishClick(schedule)}
                                                    onUnpublish={() => handleUnpublishClick(schedule)}
                                                    onDelete={canDeleteSchedule(schedule) ? () => handleDeleteClick(schedule) : null}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            )}
        </Card>
    );

    return (
        <>
            {/* Active Schedules */}
            <ScheduleTable
                schedules={sortedActiveSchedules}
                className='active'
                sortConfig={activeSortConfig}
                requestSort={requestActiveSort}
                title={t('schedule.activeSchedules')}
                emptyMessage={t('schedule.noActiveSchedules')}
                currentWeekScheduleIds={currentWeekScheduleIds}
                isCollapsible={true}
                isOpen={openStates.active}
                onToggle={() => handleToggle('active')}
            />

            {/* Inactive Schedules */}
            {sortedInactiveSchedules.length > 0 && (
                <ScheduleTable
                    schedules={sortedInactiveSchedules}
                    className='inactive'
                    sortConfig={inactiveSortConfig}
                    requestSort={requestInactiveSort}
                    title={t('schedule.inactiveSchedules')}
                    emptyMessage={t('schedule.noInactiveSchedules')}
                    currentWeekScheduleIds={currentWeekScheduleIds}
                    isCollapsible={true}
                    isOpen={openStates.inactive}
                    onToggle={() => handleToggle('inactive')}
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
                        <p>
                            <strong>{t('schedule.weekPeriod')}:</strong> {formatScheduleDate(scheduleToDelete.start_date)} - {formatScheduleDate(scheduleToDelete.end_date)}
                        </p>
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
                title={t('schedule.unpublish')}
                message={t('schedule.confirmUnpublish')}
                onConfirm={handleUnpublishConfirm}
                onCancel={() => setScheduleToUnpublish(null)}
                loading={isUpdatingStatus}
                confirmText={t('schedule.unpublish')}
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