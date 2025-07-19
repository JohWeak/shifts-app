// frontend/src/features/employee-constraints/ui/ConstraintGrid.js
import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { formatShiftTime, formatHeaderDate, getShiftTypeByTime, getShiftIcon } from 'shared/lib/utils/scheduleUtils';

const ConstraintGrid = ({
                            template,
                            constraints,
                            onCellClick,
                            getCellClass,
                            shiftColors = {}
                        }) => {
    const { t } = useI18n();


    // Get unique shift types from template
    const shiftTypes = [...new Set(
        template.flatMap(day => day.shifts.map(shift => getShiftTypeByTime(shift.start_time)))
    )].sort((a, b) => {
        // Добавим кастомную сортировку, чтобы смены шли в правильном порядке
        const order = { morning: 1, day: 2, night: 3 };
        return (order[a] || 99) - (order[b] || 99);
    });

    return (
        <>
            {/* Desktop Table */}
            <Card className="shadow desktop-constraints d-none d-md-block">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table bordered hover className="mb-0">
                            <thead>
                            <tr>
                                <th className="text-center shift-header">{t('constraints.shiftTime')}</th>
                                {template.map(day => (
                                    <th key={day.date} className="text-center">
                                        <div>{t(`calendar.weekDays.${day.weekday}`)}</div>
                                        <small className="text-muted">{formatHeaderDate(new Date(day.date))}</small>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {/* Individual shift rows */}
                            {shiftTypes.map(shiftType => {
                                const sampleShift = template[0]?.shifts.find(s => s.shift_type === shiftType);
                                if (!sampleShift) return null;

                                return (
                                    <tr key={shiftType}>
                                        <td className="shift-header align-middle text-center">
                                            {getShiftIcon(shiftType)}<br/>
                                            {formatShiftTime(sampleShift.start_time, sampleShift.duration)}
                                        </td>
                                        {template.map(day => {
                                            const dayShift = day.shifts.find(s => s.shift_type === shiftType);
                                            return dayShift ? (
                                                <td key={`${day.date}-${shiftType}`}
                                                    className={getCellClass(day.date, shiftType)}
                                                    onClick={() => onCellClick(day.date, shiftType)}
                                                    style={{
                                                        backgroundColor: constraints[day.date]?.shifts[shiftType] === 'cannot_work'
                                                            ? shiftColors.cannotWork
                                                            : constraints[day.date]?.shifts[shiftType] === 'prefer_work'
                                                                ? shiftColors.preferWork
                                                                : undefined
                                                    }}
                                                >
                                                    {/* Empty cell for user interaction */}
                                                </td>
                                            ) : (
                                                <td key={`${day.date}-${shiftType}-empty`} className="text-center text-muted">
                                                    -
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Mobile Table */}
            <Card className="shadow mobile-constraints d-md-none">
                <Card.Body className="p-0">
                    <Table bordered className="mb-0">
                        <thead>
                        <tr>
                            <th className="text-center">{t('common.day')}</th>
                            {shiftTypes.map(shiftType => (
                                <th key={shiftType} className="shift-header text-center">
                                    {t(`shift.${shiftType}`)}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {template.map(day => (
                            <tr key={day.date}>
                                <td className="text-center">
                                    <div>{t(`calendar.weekDays.${day.weekday}`)}</div>
                                    <small className="text-muted">{formatHeaderDate(new Date(day.date))}</small>
                                </td>
                                {shiftTypes.map(shiftType => {
                                    const shift = day.shifts.find(s => s.shift_type === shiftType);
                                    return shift ? (
                                        <td key={`${day.date}-${shiftType}`}
                                            className={getCellClass(day.date, shiftType)}
                                            onClick={() => onCellClick(day.date, shiftType)}
                                            style={{
                                                backgroundColor: constraints[day.date]?.shifts[shiftType] === 'cannot_work'
                                                    ? shiftColors.cannotWork
                                                    : constraints[day.date]?.shifts[shiftType] === 'prefer_work'
                                                        ? shiftColors.preferWork
                                                        : undefined
                                            }}
                                        >
                                            {/* Empty cell */}
                                        </td>
                                    ) : (
                                        <td key={`${day.date}-${shiftType}`} className="text-center text-muted">
                                            -
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </>
    );
};

export default ConstraintGrid;