//frontend/src/features/admin-schedule-management/ui/ScheduleView/components/Position/components/PositionScheduleTable/index.js

import React from 'react';
import { Table } from 'react-bootstrap';
import { formatTableHeaderDate, getDayName, formatShiftTime } from 'shared/lib/utils/scheduleUtils';
import { getContrastTextColor } from 'shared/lib/utils/colorUtils';

const PositionScheduleTable = ({
                                   weekDates,
                                   shifts,
                                   isMobile,
                                   isDark,
                                   t,
                                   canEdit,
                                   getShiftColor,
                                   openColorPicker,
                                   renderCell
                               }) => {
    return (
        <Table responsive bordered className="schedule-table mb-0">
            <thead>
            <tr>
                <th className="text-center shift-header">{t('schedule.shift')}</th>
                {weekDates.map((date, index) => {
                    const dayIndex = date.getDay();
                    const dayName = getDayName(dayIndex, t, isMobile);
                    const formattedDate = formatTableHeaderDate(date);

                    return (
                        <th key={index} className="text-center">
                            <div>
                                <strong>{dayName}</strong><br />
                                <small>{formattedDate}</small>
                            </div>
                        </th>
                    );
                })}
            </tr>
            </thead>
            <tbody>
            {shifts.length > 0 ? (
                shifts.map(shift => {
                    const currentColor = getShiftColor(shift);
                    const textColor = getContrastTextColor(currentColor, isDark);
                    return (
                        <tr key={shift.shift_id} style={{ backgroundColor: `${currentColor}` || 'transparent' }}>
                            <td
                                className='text-center shift-name-cell'
                                style={{
                                    backgroundColor: currentColor || '#f8f9fa',
                                    color: textColor,
                                    position: 'relative'
                                }}
                            >
                                <div className="shift-info">
                                    <div className="shift-name">
                                        {shift.shift_name}
                                    </div>
                                    <div className="shift-time" style={{ color: textColor }}>
                                        {formatShiftTime(shift.start_time, shift.end_time)}
                                    </div>
                                </div>
                                {canEdit && (
                                    <button
                                        className="btn btn-sm shift-color-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openColorPicker(
                                                shift.shift_id,
                                                currentColor,
                                                shift
                                            );
                                        }}
                                        title={t('shift.editColor')}
                                    >
                                        <i className="bi bi-palette-fill"></i>
                                    </button>
                                )}
                            </td>
                            {Array.from({ length: 7 }, (_, dayIndex) => renderCell(shift, dayIndex))}
                        </tr>
                    );
                })) : (
                <tr>
                    <td colSpan="8" className="text-center text-muted py-3">
                        {t('schedule.noShiftsDefined')}
                    </td>
                </tr>
            )}
            </tbody>
        </Table>
    );
};

export default PositionScheduleTable;