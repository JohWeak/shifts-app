// frontend/src/features/employee-requests/ui/PermanentConstraintForm/PermanentConstraintGrid.js

import React from 'react';
import { Table } from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {formatShiftTime, getCanonicalShiftType, getDayNames, getShiftIcon} from 'shared/lib/utils/scheduleUtils';
import { getContrastTextColor } from 'shared/lib/utils/colorUtils';
import { useShiftColor } from "../../../../shared/hooks/useShiftColor";

// --- КОМПОНЕНТЫ СЕТКИ (АДАПТИРОВАНЫ ПОД НОВЫЕ СТИЛИ) ---

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

const ShiftHeader = ({ shift, getShiftHeaderStyle, getShiftColor, as: Component = 'th' }) => {
    const icon = getShiftIcon(getCanonicalShiftType(shift.shift_name));

    // --- ИСПРАВЛЕНИЕ: Вычисляем стиль для внутреннего div прямо здесь ---
    const innerDivStyle = {
        backgroundColor: getShiftColor(shift),
        color: getContrastTextColor(getShiftColor(shift))
    };

    return (
        // Внешняя ячейка <th> использует стиль из пропсов
        <Component className="shift-header-cell sticky-column" style={getShiftHeaderStyle(shift)}>
            <div className="shift-header-info" style={innerDivStyle}>
                <span className="shift-header-name">{icon} {shift.shift_name}</span>
                <span className="shift-header-time">{formatShiftTime(shift.start_time, shift.end_time)}</span>
            </div>
        </Component>
    );
};

const DayHeader = ({ day, onDayClick, getDayHeaderStyle, as: Component = 'th', isMobile = false }) => {
    // --- ИСПРАВЛЕНИЕ: Правильное использование isMobile для getDayNames ---
    const { t } = useI18n();
    const dayNames = getDayNames(t, true); // true для коротких имен
    const dayName = isMobile ? dayNames[new Date(`1970-01-04T12:00:00Z`).getDay()] || day.substring(0,3) : day; // Нужно найти правильный индекс

    return (
        <Component className="day-header clickable" style={getDayHeaderStyle(day)} onClick={() => onDayClick(day)}>
            <div className="day-name">{day}</div>
        </Component>
    );
};


const PermanentConstraintGrid = (props) => {
    const { daysOfWeek, shifts, onCellClick, onDayClick, getCellStyles, getShiftColor, getDayHeaderStyle, isMobile, justChangedCell } = props;
    const { t } = useI18n();
    const commonCellProps = { onCellClick, getCellStyles };

    const DesktopGrid = () => (
        <div className="table-responsive desktop-constraints">
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
                        <ShiftHeader
                            shift={shift}
                            getShiftColor={getShiftColor}
                            getShiftHeaderStyle={props.getShiftHeaderStyle}
                            as="td"
                        />
                        {daysOfWeek.map(day => (
                            <GridCell
                                key={`${day}-${shift.id}`} day={day} shift={shift} {...commonCellProps}
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
        <div className="table-responsive mobile-constraints">
            <Table bordered className="full-schedule-table">
                <thead>
                <tr>
                    <th className="day-header-cell sticky-column">{t('common.day')}</th>
                    {shifts.map(shift => (
                        <ShiftHeader
                            key={shift.id}
                            shift={shift}
                            getShiftHeaderStyle={props.getShiftHeaderStyle}
                            getShiftColor={props.getShiftColor}
                            as="th"
                        />
                    ))}
                </tr>
                </thead>
                <tbody>
                {daysOfWeek.map(day => (
                    <tr key={day.date}>
                        <DayHeader day={day} onDayClick={onDayClick} getDayHeaderStyle={getDayHeaderStyle} isMobile={true} as="td" />
                        {shifts.map(shift => (
                            <GridCell
                                key={`${day}-${shift.id}`} day={day} shift={shift} {...commonCellProps}
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