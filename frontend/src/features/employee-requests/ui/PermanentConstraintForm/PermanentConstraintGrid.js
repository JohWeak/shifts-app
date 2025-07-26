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

const ShiftHeader = ({shift, getShiftHeaderStyle, getShiftHeaderCellStyle, as: Component = 'th'}) => {
    const icon = getShiftIcon(getCanonicalShiftType(shift.shift_name));
    return (
        <Component className="shift-header-cell sticky-column" style={getShiftHeaderCellStyle(shift)}>
            <div className="shift-header-info" style={getShiftHeaderStyle(shift)}>
                <span className="shift-header-name">{icon} {shift.shift_name}</span>
                <span className="shift-header-time">{formatShiftTime(shift.start_time, shift.end_time)}</span>
            </div>
        </Component>
    );
};

const DayHeader = ({day, dayIndex, onDayClick, getDayHeaderStyle, as: Component = 'th', isMobile = false}) => {
    const {t} = useI18n();
    const translatedDayName = getDayName(dayIndex, t, isMobile);
    return (
        <Component className="day-header clickable" style={getDayHeaderStyle(day)} onClick={() => onDayClick(day)}>
            <div className="day-name">{translatedDayName}</div>
        </Component>
    );
};


const PermanentConstraintGrid = ({
                                     daysOfWeek,
                                     shifts,
                                     isMobile,
                                     onCellClick,
                                     onDayClick,
                                     getCellStyles,
                                     getShiftHeaderStyle,
                                     getShiftHeaderCellStyle,
                                     getDayHeaderStyle,
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