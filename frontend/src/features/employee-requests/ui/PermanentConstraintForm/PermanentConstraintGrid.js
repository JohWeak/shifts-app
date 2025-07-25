// frontend/src/features/employee-requests/ui/PermanentConstraintForm/PermanentConstraintGrid.js

import React from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { formatShiftTime, getCanonicalShiftType, getShiftIcon } from 'shared/lib/utils/scheduleUtils';

// --- Внутренние компоненты, адаптированные для постоянных ограничений ---

const GridCell = ({ day, shift, onCellClick, getCellStyles, isJustChanged }) => {
    const styles = getCellStyles(day, shift.id);
    const finalClasses = `${styles.foregroundClasses} ${isJustChanged ? 'is-appearing' : ''}`;

    return (
        <td className="constraint-td-wrapper" style={styles.tdStyle}>
            <div
                className={finalClasses}
                style={styles.foregroundStyle}
                onClick={() => onCellClick(day, shift.id)}
            >
                {styles.status === 'cannot_work' && <X className="cell-icon" />}
            </div>
        </td>
    );
};

const ShiftHeader = ({ shift, getShiftHeaderStyle }) => {
    const icon = getShiftIcon(getCanonicalShiftType(shift.shift_name));
    return (
        <th className="shift-header-cell" style={getShiftHeaderStyle(shift)}>
            <div className="shift-header-info">
                <span className="shift-header-name">{icon} {shift.shift_name}</span>
                <span className="shift-header-time">{formatShiftTime(shift.start_time, shift.duration)}</span>
            </div>
        </th>
    );
};

const DayHeader = ({ day, onDayClick }) => (
    <td className="day-header-cell clickable" onClick={() => onDayClick(day)}>
        <div className="day-name">{day}</div>
    </td>
);


const PermanentConstraintGrid = ({ daysOfWeek, shifts, onCellClick, onDayClick, getCellStyles, getShiftHeaderStyle, isMobile, justChangedCell }) => {
    const { t } = useI18n();

    const commonCellProps = { onCellClick, getCellStyles };

    const DesktopGrid = () => (
        <div className="table-responsive">
            <Table bordered className="full-schedule-table">
                <thead>
                <tr>
                    <th className="day-header-cell sticky-column">{t('common.day')}</th>
                    {shifts.map(shift => (
                        <ShiftHeader key={shift.id} shift={shift} getShiftHeaderStyle={getShiftHeaderStyle} />
                    ))}
                </tr>
                </thead>
                <tbody>
                {daysOfWeek.map(day => (
                    <tr key={day}>
                        <DayHeader day={day} onDayClick={onDayClick} />
                        {shifts.map(shift => (
                            <GridCell
                                key={`${day}-${shift.id}`}
                                day={day}
                                shift={shift}
                                {...commonCellProps}
                                isJustChanged={`${day}-${shift.id}` === justChangedCell}
                            />
                        ))}
                    </tr>
                ))}
                </tbody>
            </Table>
        </div>
    );

    const MobileGrid = () => (
        <div className="table-responsive">
            <Table bordered className="full-schedule-table">
                <thead>
                <tr>
                    <th className="day-header-cell sticky-column">{t('common.day')}</th>
                    {shifts.map(shift => (
                        <ShiftHeader key={shift.id} shift={shift} getShiftHeaderStyle={getShiftHeaderStyle} />
                    ))}
                </tr>
                </thead>
                <tbody>
                {daysOfWeek.map(day => (
                    <tr key={day}>
                        <DayHeader day={day} onDayClick={onDayClick} />
                        {shifts.map(shift => (
                            <GridCell
                                key={`${day}-${shift.id}`}
                                day={day}
                                shift={shift}
                                {...commonCellProps}
                                isJustChanged={`${day}-${shift.id}` === justChangedCell}
                            />
                        ))}
                    </tr>
                ))}
                </tbody>
            </Table>
        </div>
    );

    // В данном случае, десктопная и мобильная верстка могут быть одинаковыми,
    // так как таблица адаптивна сама по себе. Если потребуется разная логика, можно раскомментировать.
    return <DesktopGrid />;
};

export default PermanentConstraintGrid;