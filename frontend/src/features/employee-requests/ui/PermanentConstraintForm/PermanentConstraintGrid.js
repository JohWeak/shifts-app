// frontend/src/features/employee-requests/ui/PermanentConstraintForm/PermanentConstraintGrid.js

import React from 'react';
import { Table } from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { formatShiftTime, getCanonicalShiftType, getShiftIcon } from 'shared/lib/utils/scheduleUtils';

// --- ВНУТРЕННИЕ КОМПОНЕНТЫ СЕТКИ ---

const GridCell = ({ day, shift, onCellClick, getCellStyles, isJustChanged }) => {
    const styles = getCellStyles(day, shift.id);
    const finalClasses = `${styles.foregroundClasses} ${isJustChanged ? 'is-appearing' : ''}`;
    return (
        <td className="constraint-td-wrapper" style={styles.tdStyle}>
            <div className={finalClasses} style={styles.foregroundStyle} onClick={() => onCellClick(day, shift.id)}>
                {styles.status === 'cannot_work' && <X className="cell-icon" />}
            </div>
        </td>
    );
};

const ShiftHeader = ({ shift, getShiftHeaderStyle }) => {
    const icon = getShiftIcon(getCanonicalShiftType(shift.shift_name));
    return (
        <th className="shift-header-cell sticky-column" style={getShiftHeaderStyle(shift)}>
            <div className="shift-header-info">
                <span className="shift-header-name">{icon} {shift.shift_name}</span>
                {/* --- ИЗМЕНЕНИЕ: Добавляем время смены --- */}
                <span className="shift-header-time">{formatShiftTime(shift.start_time, shift.duration)}</span>
            </div>
        </th>
    );
};

const DayHeader = ({ day, onDayClick, getDayHeaderStyle, isMobile }) => (
    <th className="day-header-cell clickable" style={getDayHeaderStyle(day)} onClick={() => onDayClick(day)}>
        <div className="day-name">{isMobile ? day.substring(0, 3) : day}</div>
    </th>
);

const PermanentConstraintGrid = (props) => {
    const { daysOfWeek, shifts, onCellClick, onDayClick, getCellStyles, getShiftHeaderStyle, getDayHeaderStyle, isMobile, justChangedCell } = props;
    const { t } = useI18n();
    const commonCellProps = { onCellClick, getCellStyles };

    const DesktopGrid = () => (
        <div className="table-responsive">
            <Table bordered className="full-schedule-table">
                <thead>
                <tr>
                    <th className="shift-header-cell sticky-column">{t('common.shift')}</th>
                    {daysOfWeek.map(day => (
                        <DayHeader key={day} day={day} onDayClick={onDayClick} getDayHeaderStyle={getDayHeaderStyle} />
                    ))}
                </tr>
                </thead>
                <tbody>
                {shifts.map(shift => (
                    <tr key={shift.id}>
                        <ShiftHeader shift={shift} getShiftHeaderStyle={getShiftHeaderStyle} />
                        {daysOfWeek.map(day => (
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
                        <th key={shift.id} className="shift-header-cell" style={getShiftHeaderStyle(shift)}>
                            <div className="shift-header-info">
                                <span className="shift-header-name">{getShiftIcon(getCanonicalShiftType(shift.shift_name))} {shift.shift_name}</span>
                            </div>
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {daysOfWeek.map(day => (
                    <tr key={day}>
                        <DayHeader day={day} onDayClick={onDayClick} getDayHeaderStyle={getDayHeaderStyle} isMobile={true}/>
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

    return isMobile ? <MobileGrid /> : <DesktopGrid />;
};

export default PermanentConstraintGrid;