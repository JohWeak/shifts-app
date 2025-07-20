// frontend/src/features/employee-constraints/ui/ConstraintGrid.js
import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {
    formatShiftTime,
    formatHeaderDate,
    getShiftIcon,
    getDayName,
} from 'shared/lib/utils/scheduleUtils';

const ConstraintGrid = ({
                            template,
                            uniqueShifts,
                            onCellClick,
                            getCellStyle,
                            getCellClass,
                            getDayHeaderClass,
                            getShiftHeaderStyle,
                            isMobile,
                        }) => {
    const { t } = useI18n();

    // --- LOG 4: Проверяем пропсы, дошедшие до Grid ---
    console.log('[LOG 4] Props в ConstraintGrid:', { uniqueShifts, template });

    const DesktopGrid = () => (
        <Card className="shadow desktop-constraints d-none d-md-block">
            <Card.Body className="p-0">
                <div className="table-responsive">
                    <Table bordered className="mb-0">
                        <thead>
                        <tr>
                            <th className="text-center align-middle shift-header">{t('constraints.shiftTime')}</th>
                            {template.map(day => (
                                <th
                                    key={day.date}
                                    className={getDayHeaderClass(day.date)}
                                    onClick={() => onCellClick(day.date, null)}
                                >
                                    <div>{getDayName(new Date(day.date).getDay(), t)}</div>
                                    <small className="shift-time">{formatHeaderDate(new Date(day.date))}</small>
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {uniqueShifts.map(shift => {
                            // --- LOG 5: Проверяем каждую смену в цикле ---
                            console.log('[LOG 5] Рендеринг строки для смены:', shift);
                            return (

                            <tr key={shift.shift_id}>
                                <td className="shift-header align-middle text-center" style={getShiftHeaderStyle(shift)}>
                                    {getShiftIcon(shift.shift_name)}
                                    <strong className="d-block my-1">{shift.shift_name}</strong>
                                    <small className="text-muted">{formatShiftTime(shift.start_time, shift.duration)}</small>
                                </td>
                                {template.map(day => {
                                    const dayShift = day.shifts.find(s => s.shift_id === shift.shift_id);
                                    return dayShift ? (
                                        <td
                                            key={`${day.date}-${shift.shift_id}`}
                                            className={getCellClass(day.date, shift.shift_id)}
                                            onClick={() => onCellClick(day.date, shift.shift_id)}
                                            style={getCellStyle(day.date, shift.shift_id)}
                                        />
                                    ) : (
                                        <td key={`${day.date}-${shift.shift_id}-empty`} className="text-center text-muted align-middle">-</td>
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
    );

    const MobileGrid = () => (
        <Card className="shadow mobile-constraints d-md-none">
            <Card.Body className="p-0">
                <Table bordered className="mb-0">
                    <thead>
                    <tr>
                        <th className="text-center align-middle">{t('common.day')}</th>
                        {uniqueShifts.map(shift => (
                            <th
                                key={shift.shift_id}
                                className="shift-header text-center align-middle"
                                style={getShiftHeaderStyle(shift)}
                            >
                                {getShiftIcon(shift.shift_name)}
                                <strong className="d-block my-1 small">{shift.shift_name}</strong>
                                <div className="small">
                                    {formatShiftTime(shift.start_time, shift.duration)}
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {template.map(day => (
                        <tr key={day.date}>
                            <td
                                className={getDayHeaderClass(day.date)}
                                onClick={() => onCellClick(day.date, null)}
                            >
                                <div>{getDayName(new Date(day.date).getDay(), t, true)}</div>
                                <small className="text-muted">{formatHeaderDate(new Date(day.date))}</small>
                            </td>
                            {uniqueShifts.map(shift => {
                                const dayShift = day.shifts.find(s => s.shift_id === shift.shift_id);
                                return dayShift ? (
                                    <td
                                        key={`${day.date}-${shift.shift_id}`}
                                        className={getCellClass(day.date, shift.shift_id)}
                                        onClick={() => onCellClick(day.date, shift.shift_id)}
                                        style={getCellStyle(day.date, shift.shift_id)}
                                    />
                                ) : (
                                    <td key={`${day.date}-${shift.shift_id}-empty`} className="text-center text-muted align-middle">-</td>
                                );
                            })}
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );

    return isMobile ? <MobileGrid /> : <DesktopGrid />;
};

export default ConstraintGrid;