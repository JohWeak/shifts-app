// frontend/src/features/employee-requests/ui/PermanentConstraintForm/PermanentConstraintGrid.js

import React from 'react';
import {Table} from 'react-bootstrap';
import {X} from 'react-bootstrap-icons';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {formatShiftTime, getCanonicalShiftType, getDayName, getShiftIcon} from 'shared/lib/utils/scheduleUtils';


const GridCell = ({day, shift, onCellClick, getCellStyles}) => {
    const styles = getCellStyles(day, shift.id);
    return (
        <td className="constraint-td-wrapper" style={styles.tdStyle}>
            <div className={styles.foregroundClasses} style={styles.foregroundStyle}
                 onClick={() => onCellClick(day, shift.id)}>
                {styles.status === 'cannot_work' && <X className="cell-icon"/>}
            </div>
        </td>
    );
};

const ShiftHeader = ({ shift, getShiftHeaderStyle, getShiftHeaderCellStyle, as: Component = 'th', onShiftClick }) => {
    const icon = getShiftIcon(getCanonicalShiftType(shift.shift_name));
    return (
        <Component
            className="shift-header-cell sticky-column clickable"
            style={getShiftHeaderCellStyle(shift)}
            onClick={() => onShiftClick(shift.id)}
        >
            <div
                className="shift-header-info"
                style={getShiftHeaderStyle(shift)}
            >
                <span className="shift-header-name">{icon} {shift.shift_name}</span>
                <span className="shift-header-time">{formatShiftTime(shift.start_time, shift.end_time)}</span>
            </div>
        </Component>
    );
};

const DayHeader = ({ day, dayIndex, onDayClick, getDayHeaderStyle, as: Component = 'th', isMobile = false, fullyBlockedDays }) => {
    const { t } = useI18n();
    const translatedDayName = getDayName(dayIndex, t, isMobile);
    // 1. Проверяем, заблокирован ли этот день
    const isSelected = fullyBlockedDays.has(day);
    // 2. Получаем стили (красный фон) от родителя
    const innerDivStyle = getDayHeaderStyle(day);
    // 3. Формируем классы для внутреннего div'а
    const innerDivClassName = `day-header-inner ${isSelected ? 'selected' : ''}`;

    return (
        // Внешняя ячейка теперь не имеет стилей, она просто контейнер
        <Component className="day-header clickable" onClick={() => onDayClick(day)}>
            {/* Вся стилизация и логика теперь во внутреннем div'е */}
            <div className={innerDivClassName} style={innerDivStyle}>
                <div className="day-name">{translatedDayName}</div>
            </div>
        </Component>
    );
};


const PermanentConstraintGrid = ({
                                     daysOfWeek,
                                     shifts,
                                     isMobile,
                                     onCellClick,
                                     onDayClick,
                                     onShiftClick,
                                     getCellStyles,
                                     getShiftHeaderStyle,
                                     getShiftHeaderCellStyle,
                                     getDayHeaderStyle,
                                     fullyBlockedDays,
                                 }) => {
    const {t} = useI18n();

    const DesktopGrid = () => (
        <div className="table-responsive desktop-constraints">
            <Table bordered className="full-schedule-table">
                <thead>
                <tr>
                    <th className="shift-header-cell sticky-column">{t('common.shift')}</th>
                    {daysOfWeek.map((day, index) => (
                        <DayHeader
                            key={day}
                            day={day}
                            dayIndex={index}
                            onDayClick={onDayClick}
                            getDayHeaderStyle={getDayHeaderStyle}
                            fullyBlockedDays={fullyBlockedDays}
                        />
                    ))}
                </tr>
                </thead>
                <tbody>
                {shifts.map(shift => (
                    <tr key={shift.id}>
                        <ShiftHeader
                            shift={shift}
                            getShiftHeaderStyle={getShiftHeaderStyle}
                            getShiftHeaderCellStyle={getShiftHeaderCellStyle}
                            onShiftClick={onShiftClick}
                            as="td"
                        />
                        {daysOfWeek.map(day => (
                            <GridCell
                                key={`${day}-${shift.id}`}
                                day={day} shift={shift}
                                onCellClick={onCellClick}
                                getCellStyles={getCellStyles}
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
                            getShiftHeaderStyle={getShiftHeaderStyle}
                            getShiftHeaderCellStyle={getShiftHeaderCellStyle}
                            onShiftClick={onShiftClick}
                            as="th"
                        />
                    ))}
                </tr>
                </thead>
                <tbody>
                {daysOfWeek.map((day, index) => (
                    <tr key={day}>
                        <DayHeader
                            day={day}
                            dayIndex={index}
                            onDayClick={onDayClick}
                            getDayHeaderStyle={getDayHeaderStyle}
                            fullyBlockedDays={fullyBlockedDays}
                            isMobile={true}
                            as="td"
                        />
                        {shifts.map(shift => (
                            <GridCell
                                key={`${day}-${shift.id}`}
                                day={day}
                                shift={shift}
                                onCellClick={onCellClick}
                                getCellStyles={getCellStyles}
                            />
                        ))}
                    </tr>
                ))}
                </tbody>
            </Table>
        </div>
    );

    return isMobile ? <MobileGrid/> : <DesktopGrid/>;
};

export default PermanentConstraintGrid;