// frontend/src/features/admin-schedule-management/ui/ScheduleList/index.js

import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useSortableData } from 'shared/hooks/useSortableData';
import { classifySchedules } from "shared/lib/utils/scheduleUtils";
import ScheduleTableList from './components/ScheduleTableList';
import { useScheduleActions } from '../../model/hooks/useScheduleActions';

import './ScheduleList.css';

const ScheduleList = ({ schedules, onViewDetails, onScheduleDeleted }) => {
    const { t } = useI18n();
    const {
        promptDelete,
        promptPublish,
        promptUnpublish,
        renderModals,
    } = useScheduleActions();

    // --- STATE MANAGEMENT ---
    const [openStates, setOpenStates] = useState(() => {
        const saved = localStorage.getItem('schedulesOpenStates');
        return saved ? JSON.parse(saved) : { active: true, inactive: false };
    });

    useEffect(() => {
        localStorage.setItem('schedulesOpenStates', JSON.stringify(openStates));
    }, [openStates]);

    // --- DATA PREPARATION ---
    const { activeSchedules, inactiveSchedules, currentWeekScheduleIds } = useMemo(() => {
        return classifySchedules(schedules);
    }, [schedules]);

    const sortAccessors = useMemo(() => ({
        'week': (s) => s.start_date,
        'site': (s) => s.workSite?.site_name || '',
        'status': (s) => s.status,
        'updatedAt': (s) => s.updatedAt || s.createdAt,
    }), []);

    const {
        sortedItems: sortedActive,
        requestSort: requestActiveSort,
        sortConfig: activeSortConfig
    } = useSortableData(
        activeSchedules, {
            field: 'week',
            order: 'ASC'
        },
        sortAccessors
    );
    const {
        sortedItems: sortedInactive,
        requestSort: requestInactiveSort,
        sortConfig: inactiveSortConfig
    } = useSortableData(
        inactiveSchedules, {
            field: 'week',
            order: 'DESC'
        },
        sortAccessors
    );


    return (
        <>
            <ScheduleTableList
                schedules={sortedActive}
                className='active'
                sortConfig={activeSortConfig}
                requestSort={requestActiveSort}
                title={t('schedule.activeSchedules')}
                emptyMessage={t('schedule.noActiveSchedules')}
                currentWeekScheduleIds={currentWeekScheduleIds}
                isCollapsible={true}
                isOpen={openStates.active}
                onToggle={() => setOpenStates(s => ({ ...s, active: !s.active }))}
                onView={onViewDetails}
                onPublish={promptPublish}
                onUnpublish={promptUnpublish}
                onDelete={(schedule) => promptDelete(schedule, {
                    onSuccess: () => {
                        if (onScheduleDeleted) onScheduleDeleted(schedule.id);
                    }
                })}
            />

            {sortedInactive.length > 0 && (
                <ScheduleTableList
                    schedules={sortedInactive}
                    className='inactive'
                    sortConfig={inactiveSortConfig}
                    requestSort={requestInactiveSort}
                    title={t('schedule.inactiveSchedules')}
                    emptyMessage={t('schedule.noInactiveSchedules')}
                    currentWeekScheduleIds={currentWeekScheduleIds}
                    isCollapsible={true}
                    isOpen={openStates.inactive}
                    onToggle={() => setOpenStates(s => ({ ...s, inactive: !s.inactive }))}
                    onView={onViewDetails}
                    onPublish={promptPublish}
                    onUnpublish={promptUnpublish}
                    onDelete={(schedule) => promptDelete(schedule, {
                        onSuccess: () => {
                            if (onScheduleDeleted) onScheduleDeleted(schedule.id);
                        }
                    })}
                />
            )}

            {renderModals()}

        </>
    );
};

export default ScheduleList;