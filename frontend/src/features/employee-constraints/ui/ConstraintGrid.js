// frontend/src/features/employee-constraints/ui/ConstraintGrid.js
import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {
    formatShiftTime,
    formatHeaderDate,
    getShiftTypeByTime,
    getShiftIcon
} from 'shared/lib/utils/scheduleUtils';
import { hexToRgba, getContrastTextColor } from 'shared/lib/utils/colorUtils';

const ConstraintGrid = ({
                            template,
                            constraints,
                            onCellClick,
                            getCellClass,
                            shiftColors,
                            getShiftBaseColor,
                            getHoverPreviewStyle,
                            canEdit,
                            isSubmitted
                        }) => {
    const { t } = useI18n();


    // Получаем уникальные типы смен, ВЫЧИСЛЯЯ их для каждой смены из шаблона
    const shiftTypes = [...new Set(
        template.flatMap(day => day.shifts.map(shift => getShiftTypeByTime(shift.start_time, shift.duration)))
    )].sort((a, b) => {
        // Добавляем кастомную сортировку, чтобы смены всегда шли в порядке Утро -> День -> Ночь
        const order = { morning: 1, day: 2, night: 3 };
        return (order[a] || 99) - (order[b] || 99);
    });

    // ФУНКЦИЯ для стилизации заголовков/ячеек дней ---
    const getDayHeaderClass = (date) => {
        // Берем статус всего дня из weeklyConstraints
        const status = constraints[date]?.day_status || 'neutral';
        const baseClass = 'day-header';
        const statusClass = status === 'cannot_work' ? 'cannot-work' :
            status === 'prefer_work' ? 'prefer-work' : 'neutral';
        // Делаем кликабельным, только если можно редактировать
        const clickableClass = canEdit && !isSubmitted ? 'clickable' : '';

        return `${baseClass} ${statusClass} ${clickableClass}`;
    };

    const getSampleShift = (shiftType) => {
        for (const day of template) {
            const foundShift = day.shifts.find(s => getShiftTypeByTime(s.start_time, s.duration) === shiftType);
            if (foundShift) {
                return foundShift;
            }
        }
        return null; // На случай если смен такого типа нет
    };

    const getCellStyle = (date, shiftType) => {
        const status = constraints[date]?.shifts[shiftType] || 'neutral';
        const alpha = 1;
        const baseAlpha = 0.2;

        let backgroundColor;

        if (status === 'cannot_work') {
            backgroundColor = hexToRgba(shiftColors.cannotWork, alpha);
        } else if (status === 'prefer_work') {
            backgroundColor = hexToRgba(shiftColors.preferWork, alpha);
        } else {
            // НЕЙТРАЛЬНОЕ СОСТОЯНИЕ: используем getShiftBaseColor
            const sampleShift = getSampleShift(shiftType);
            const baseColor = sampleShift ? getShiftBaseColor(sampleShift) : '#E0E0E0';
            backgroundColor = hexToRgba(baseColor, baseAlpha);
        }

        // getContrastTextColor ожидает HEX, поэтому для rgba вернем дефолтный цвет
        const textColor = backgroundColor.startsWith('rgba')
            ? getContrastTextColor(shiftColors[status] || '#000000') // Пытаемся угадать
            : getContrastTextColor(backgroundColor);

        return { backgroundColor, color: textColor };
    };

    const getFinalCellStyle = (date, shiftType) => {
        const baseStyle = getCellStyle(date, shiftType); // Стили для состояния покоя
        const hoverStyle = getHoverPreviewStyle(date, shiftType); // Стили для ховера (переменная и цвет текста)

        return {
            ...baseStyle,
            '--cell-hover-color': hoverStyle['--cell-hover-color']
            // Цвет текста уже управляется getCellStyle, поэтому hoverStyle.color нам не нужен здесь
        };
    };

    const getShiftHeaderStyle = (shiftType) => {
        const sampleShift = getSampleShift(shiftType);
        const baseColor = sampleShift ? getShiftBaseColor(sampleShift) : '#E0E0E0';
        return {
            backgroundColor: baseColor,
            color: getContrastTextColor(baseColor)
        };
    };


    return (
        <>
            {/* Desktop Table */}
            <Card className="shadow desktop-constraints d-none d-md-block">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table bordered className="mb-0">
                            <thead>
                            <tr>
                                <th className="text-center align-middle shift-header ">{t('constraints.shiftTime')}</th>
                                {template.map(day => (
                                    <th
                                        key={day.date}
                                        className={getDayHeaderClass(day.date)}
                                        // При клике вызываем onCellClick, передавая null в качестве shiftType
                                        onClick={() => onCellClick(day.date, null)}
                                    >
                                        <div>{t(`calendar.weekDays.${day.weekday}`)}</div>
                                        <small className="shift-time">{formatHeaderDate(new Date(day.date))}</small>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {/* Individual shift rows */}
                            {shiftTypes.map(shiftType => {
                                const sampleShift = template[0]?.shifts.find(s => getShiftTypeByTime(s.start_time, s.duration) === shiftType);
                                if (!sampleShift) return null;

                                return (
                                    <tr key={shiftType}>
                                        <td className="shift-header align-middle text-center"
                                            style={getShiftHeaderStyle(shiftType)}
                                        >
                                            {getShiftIcon(shiftType)}
                                            <strong className="d-block my-1">{sampleShift.shift_name || t(`shift.${shiftType}`)}</strong>
                                            <small className="text-muted">{formatShiftTime(sampleShift.start_time, sampleShift.duration)}</small>
                                        </td>
                                        {template.map(day => {
                                            const dayShift = day.shifts.find(s => getShiftTypeByTime(s.start_time, s.duration) === shiftType);                                            return dayShift ? (
                                                <td key={`${day.date}-${shiftType}`}
                                                    className={getCellClass(day.date, shiftType)}
                                                    onClick={() => onCellClick(day.date, shiftType)}
                                                    style={getFinalCellStyle(day.date, shiftType)}                                                >
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
                            <th className="text-center align-middle">{t('common.day')}</th>
                            {shiftTypes.map(shiftType => {
                                // Находим образец смены, чтобы получить время и иконку
                                const sampleShift = getSampleShift(shiftType);
                                if (!sampleShift) return null; // Защита, если смены нет

                                return (
                                    <th
                                        key={shiftType}
                                        className="shift-header text-center align-middle" // Добавляем align-middle для вертикального выравнивания
                                        style={getShiftHeaderStyle(shiftType)} // Применяем стиль для цвета
                                    >
                                        {/* Добавляем содержимое как в десктопной версии */}
                                        {getShiftIcon(shiftType)}
                                        <strong className="d-block my-1 small">{sampleShift.shift_name || t(`shift.${shiftType}`)}</strong>
                                        <div className="small text-muted" style={{fontSize: '0.7em'}}>
                                            {formatShiftTime(sampleShift.start_time, sampleShift.duration)}
                                        </div>
                                    </th>
                                );
                            })}


                        </tr>
                        </thead>
                        <tbody>
                        {template.map(day => (
                            <tr key={day.date}>
                                <td
                                    className={getDayHeaderClass(day.date)}
                                    onClick={() => onCellClick(day.date, null)}
                                >
                                    <div>{t(`calendar.weekDays.${day.weekday}`)}</div>
                                    <small className="text-muted">{formatHeaderDate(new Date(day.date))}</small>
                                </td>
                                {shiftTypes.map(shiftType => {
                                    const shift = day.shifts.find(s => getShiftTypeByTime(s.start_time, s.duration) === shiftType);                                    return shift ? (
                                        <td
                                            key={`${day.date}-${shiftType}`}
                                            className={getCellClass(day.date, shiftType)}
                                            onClick={() => onCellClick(day.date, shiftType)}
                                            style={getFinalCellStyle(day.date, shiftType)}
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