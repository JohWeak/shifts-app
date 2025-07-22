// frontend/src/features/employee-constraints/ui/ConstraintGrid.js
import React from 'react';
import {Card, Table} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {
    formatShiftTime,
    formatHeaderDate,
    getCanonicalShiftType,
    getShiftIcon,
    getDayName,
} from 'shared/lib/utils/scheduleUtils';

// Компонент для отрисовки ячейки данных таблицы
const GridCell = ({ day, shift, onCellClick, getCellStyles }) => {
    const dayShift = day.shifts.find(s => s.shift_id === shift.shift_id);
    const { backgroundStyle, foregroundStyle, foregroundClasses, status } = getCellStyles(day.date, shift.shift_id);

    const isNotClickable = !foregroundClasses.includes('clickable');
    const tdClassName = `constraint-td-wrapper ${isNotClickable ? 'not-allowed' : ''}`;

    if (!dayShift) {
        return (
            <td key={`${day.date}-${shift.shift_id}-empty`} className={`${tdClassName} text-center text-muted align-middle`}>
                -
            </td>
        );
    }

    return (
        <td
            key={`${day.date}-${shift.shift_id}`}
            className={tdClassName}
        >
            <div className="constraint-cell-background" style={backgroundStyle}/>

            <div
                className={foregroundClasses}
                style={foregroundStyle}
                onClick={() => onCellClick(day.date, shift.shift_id)}
            >
                {/* 1. Иконки для УЖЕ ВЫБРАННОГО состояния */}
                {status === 'cannot_work' && <i className="bi bi-x cell-icon selected-icon" />}
                {status === 'prefer_work' && <i className="bi bi-check cell-icon selected-icon" />}

                {/* 2. "Скрытые" иконки для СОСТОЯНИЯ НАВЕДЕНИЯ (появляются через CSS) */}
                <i className="bi bi-x cell-icon hover-icon hover-icon-cannot-work" />
                <i className="bi bi-check cell-icon hover-icon hover-icon-prefer-work" />
            </div>
        </td>
    );
};


// Компонент для отрисовки заголовка смены (может быть как <th>, так и <td>)
const ShiftHeader = ({shift, getShiftHeaderStyle, getShiftHeaderCellStyle, as: Component = 'th', isMobile = false}) => {
    const canonicalType = getCanonicalShiftType(shift.shift_name);
    const icon = getShiftIcon(canonicalType);

    return (
        <Component
            className="shift-header-cell sticky-column"
            style={getShiftHeaderCellStyle(shift)}
        >
            <div
                className="shift-header-info"
                style={getShiftHeaderStyle(shift)}
            >
                <span className="shift-header-name">{icon} {shift.shift_name}</span>
                <span className="shift-header-time">{formatShiftTime(shift.start_time, shift.duration)}</span>
            </div>
        </Component>
    );
};

// Компонент для отрисовки заголовка дня (может быть как <th>, так и <td>)
const DayHeader = ({day, getDayHeaderClass, onCellClick, t, as: Component = 'th', isMobile = false}) => (
    <Component
        className={`${getDayHeaderClass(day.date)} day-header-cell`} // класс из FullScheduleView
        onClick={() => onCellClick(day.date, null)}
    >
        {/* Структура теперь соответствует FullScheduleView */}
        <div className="day-name">{getDayName(new Date(day.date).getDay(), t, isMobile)}</div>
        <small className="day-date">
            {formatHeaderDate(new Date(day.date))}
        </small>
    </Component>
);


const ConstraintGrid = (props) => {
    const {
        template,
        uniqueShifts,
        onCellClick,
        getCellStyles,
        getDayHeaderClass,
        getShiftHeaderStyle,
        getShiftHeaderCellStyle,
        isMobile,
    } = props;

    const {t} = useI18n();

    const commonCellProps = { onCellClick, getCellStyles };

    const DesktopGrid = () => (
        <Card className="shadow desktop-constraints d-none d-md-block">
            <Card.Body className="p-0">
                <div className="table-responsive">
                    <Table bordered className=" full-schedule-table">
                        <thead>
                        <tr>
                            <th className="shift-header-cell sticky-column">{t('employee.schedule.shift')}</th>
                            {template.map(day => (
                                <DayHeader
                                    key={day.date}
                                    day={day}
                                    getDayHeaderClass={getDayHeaderClass}
                                    onCellClick={onCellClick}
                                    t={t}
                                />
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {uniqueShifts.map(shift => (
                            <tr key={shift.shift_id}>
                                <ShiftHeader
                                    shift={shift}
                                    getShiftHeaderStyle={getShiftHeaderStyle}
                                    getShiftHeaderCellStyle={getShiftHeaderCellStyle}
                                    as="td"
                                />
                                {template.map(day => (
                                    <GridCell
                                        key={`${day.date}-${shift.shift_id}`}
                                        day={day}
                                        shift={shift}
                                        {...commonCellProps}
                                    />
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );

    const MobileGrid = () => (
        <Card className="shadow mobile-constraints d-md-none">
            <Card.Body className="p-0">
                <Table bordered className="mb-0 full-schedule-table">
                    <thead>
                    <tr>
                        <th className="shift-header-cell sticky-column">{t('common.day')}</th>
                        {uniqueShifts.map(shift => (
                            <ShiftHeader
                                key={shift.shift_id}
                                shift={shift}
                                getShiftHeaderStyle={getShiftHeaderStyle}
                                getShiftHeaderCellStyle={getShiftHeaderCellStyle}
                                isMobile
                            />
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {template.map(day => (
                        <tr key={day.date}>
                            <DayHeader
                                day={day}
                                getDayHeaderClass={getDayHeaderClass}
                                onCellClick={onCellClick}
                                t={t}
                                as="td"
                                isMobile
                            />
                            {uniqueShifts.map(shift => (
                                <GridCell
                                    key={`${day.date}-${shift.shift_id}`}
                                    day={day}
                                    shift={shift}
                                    {...commonCellProps}
                                />
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );

    return isMobile ? <MobileGrid/> : <DesktopGrid/>;
};

export default ConstraintGrid;