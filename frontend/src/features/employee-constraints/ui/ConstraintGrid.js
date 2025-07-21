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
const GridCell = ({day, shift, onCellClick, getCellClass, getCellStyle}) => {
    const dayShift = day.shifts.find(s => s.shift_id === shift.shift_id);

    if (!dayShift) {
        return <td key={`${day.date}-${shift.shift_id}-empty`} className="text-center text-muted align-middle">-</td>;
    }

    return (
        <td
            key={`${day.date}-${shift.shift_id}`}
            className={getCellClass(day.date, shift.shift_id)}
            onClick={() => onCellClick(day.date, shift.shift_id)}
            style={getCellStyle(day.date, shift.shift_id)}
        />
    );
};

// Компонент для отрисовки заголовка смены (может быть как <th>, так и <td>)
const ShiftHeader = ({shift, getShiftHeaderStyle, as: Component = 'th', isMobile = false}) => {
    const canonicalType = getCanonicalShiftType(shift.shift_name);
    const icon = getShiftIcon(canonicalType);

    return (
        <Component
            className="shift-header align-middle text-center"
            style={getShiftHeaderStyle(shift)}
        >
            <strong className={`d-block my-1 ${isMobile ? 'small' : ''}`}>{icon} {shift.shift_name}</strong>
            <div className="small">{formatShiftTime(shift.start_time, shift.duration)}</div>
        </Component>
    );
};

// Компонент для отрисовки заголовка дня (может быть как <th>, так и <td>)
const DayHeader = ({day, getDayHeaderClass, onCellClick, t, as: Component = 'th', isMobile = false}) => (
    <Component
        className={getDayHeaderClass(day.date)}
        onClick={() => onCellClick(day.date, null)}
    >
        <div>{getDayName(new Date(day.date).getDay(), t, isMobile)}</div>
        <small className={isMobile ? "text-muted" : "shift-time"}>
            {formatHeaderDate(new Date(day.date))}
        </small>
    </Component>
);


const ConstraintGrid = (props) => {
    const {
        template,
        uniqueShifts,
        onCellClick,
        getCellStyle,
        getCellClass,
        getDayHeaderClass,
        getShiftHeaderStyle,
        isMobile,
    } = props;

    const {t} = useI18n();

    const commonCellProps = {onCellClick, getCellClass, getCellStyle};

    const DesktopGrid = () => (
        <Card className="shadow desktop-constraints d-none d-md-block">
            <Card.Body className="p-0">
                <div className="table-responsive">
                    <Table bordered className="mb-0">
                        <thead>
                        <tr>
                            <th className="text-center align-middle">{t('common.day')}</th>
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
                <Table bordered className="mb-0">
                    <thead>
                    <tr>
                        <th className="text-center align-middle">{t('common.day')}</th>
                        {uniqueShifts.map(shift => (
                            <ShiftHeader
                                key={shift.shift_id}
                                shift={shift}
                                getShiftHeaderStyle={getShiftHeaderStyle}
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