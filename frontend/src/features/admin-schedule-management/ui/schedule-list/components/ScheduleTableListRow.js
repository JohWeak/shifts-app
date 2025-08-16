//frontend/src/features/admin-schedule-management/ui/schedule-list/components/ScheduleTableListRow.js

import React from 'react';
import { Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import { formatWeekRange, formatDateTime, canDeleteSchedule } from "shared/lib/utils/scheduleUtils";
import ScheduleActionButtons from '../../ScheduleActionButtons';

const ScheduleTableListRow = ({ schedule, isCurrent, onView, onPublish, onUnpublish, onDelete }) => {
    const { t, locale } = useI18n();

    return (
        <tr
            className={`schedule-row ${isCurrent ? 'current-week' : ''}`}
            onClick={() => onView(schedule.id)}
        >
            <td className={isCurrent ? 'current-week-cell' : ''}>
                <div className="week-period-cell date-range">
                    {formatWeekRange(schedule.start_date, locale)}
                    {isCurrent && (
                        <Badge bg="info" className="ms-2 current-week-badge">
                            {t('schedule.currentWeek')}
                        </Badge>
                    )}
                </div>
            </td>
            <td className={isCurrent ? 'current-week-cell' : ''}>
                <span className="site-name">{schedule.workSite?.site_name || 'N/A'}</span>
            </td>
            <td className={isCurrent ? 'current-week-cell' : ''}>
                <span className="last-updated">{formatDateTime(schedule.updatedAt || schedule.createdAt, locale)}</span>
            </td>
            <td className={isCurrent ? 'current-week-cell' : ''}>
                <StatusBadge status={schedule.status} />
            </td>
            <td className={`actions-cell ${isCurrent ? 'current-week-cell' : ''}`}>
                <ScheduleActionButtons
                    schedule={schedule}
                    variant="dropdown"
                    onView={() => onView(schedule.id)}
                    onPublish={() => onPublish(schedule)}
                    onUnpublish={() => onUnpublish(schedule)}
                    onDelete={canDeleteSchedule(schedule) ? () => onDelete(schedule) : null}
                />
            </td>
        </tr>
    );
};

export default ScheduleTableListRow;
