// frontend/src/shared/ui/components/DatePicker/DatePicker.js
import React, { useState, useRef, useEffect } from 'react';
import { Form, InputGroup, Overlay, Popover } from 'react-bootstrap';
import { format, parse, isValid, startOfWeek, endOfWeek } from 'date-fns';
import { enUS, he, ru } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './DatePicker.css';

const DatePicker = ({
                        value,
                        onChange,
                        minDate = new Date(),
                        weekStartsOn = 0,
                        placeholder = 'Select date',
                        dateFormat = 'dd.MM.yyyy',
                        disabled = false,
                        className = '',
                        isInvalid = false,
                    }) => {
    const { language } = useI18n();
    const [showCalendar, setShowCalendar] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [hoveredDay, setHoveredDay] = useState(null);
    const [selectedDate, setSelectedDate] = useState(value);
    const inputRef = useRef(null);

    const localeMap = {
        en: enUS,
        he: he,
        ru: ru,
    };
    const currentLocale = localeMap[language] || enUS;

    useEffect(() => {
        if (value && isValid(value)) {
            setSelectedDate(value);
            setInputValue(format(value, dateFormat));
        } else {
            setSelectedDate(undefined);
            setInputValue('');
        }
    }, [value, dateFormat]);


    const handleDateSelect = (date) => {
        if (!date) return;
        const weekStart = startOfWeek(date, { weekStartsOn });
        setSelectedDate(weekStart);
        setInputValue(format(weekStart, dateFormat));
        onChange(weekStart);
    };

    // ИСПРАВЛЕНО: Логика закрытия календаря
    const handleDayClick = (date, modifiers) => {
        // Используем встроенный модификатор 'disabled', это надежнее
        if (modifiers.disabled) {
            return;
        }
        handleDateSelect(date);
        setShowCalendar(false);
    };

    const handleInputChange = (e) => {
        const str = e.target.value;
        setInputValue(str);
        const parsedDate = parse(str, dateFormat, new Date());
        if (isValid(parsedDate)) {
            handleDateSelect(parsedDate);
        }
    };

    const handleInputClick = () => {
        if (!disabled) setShowCalendar(true);
    };

    // ИСПРАВЛЕНО: Логика применения стилей
    const modifiers = {};

    // Сначала применяем стили для ВЫБРАННОЙ недели
    if (selectedDate) {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn });
        modifiers.selected_week = { from: weekStart, to: weekEnd };
        modifiers.selected_week_start = weekStart;
        modifiers.selected_week_end = weekEnd;
    }

    // Затем, НЕ УДАЛЯЯ старые, добавляем стили для НАВЕДЕННОЙ недели
    if (hoveredDay) {
        const weekStart = startOfWeek(hoveredDay, { weekStartsOn });
        const weekEnd = endOfWeek(hoveredDay, { weekStartsOn });
        modifiers.hovered_week = { from: weekStart, to: weekEnd };
        modifiers.hovered_week_start = weekStart;
        modifiers.hovered_week_end = weekEnd;
    }

    // Имена классов остались те же, их менять не нужно
    const modifiersClassNames = {
        hovered_week: 'rdp-day_modifier--hovered_week',
        hovered_week_start: 'rdp-day_modifier--hovered_week_start',
        hovered_week_end: 'rdp-day_modifier--hovered_week_end',
        selected_week: 'rdp-day_modifier--selected_week',
        selected_week_start: 'rdp-day_modifier--selected_week_start',
        selected_week_end: 'rdp-day_modifier--selected_week_end',
        today: 'rdp-day_today',
    };

    return (
        <div className={`custom-datepicker ${className}`}>
            <InputGroup onClick={handleInputClick} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
                <Form.Control
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    isInvalid={isInvalid}
                    className="datepicker-input"
                    readOnly
                />
                <InputGroup.Text>
                    <i className="bi bi-calendar3"></i>
                </InputGroup.Text>
            </InputGroup>

            <Overlay show={showCalendar} target={inputRef.current} placement="bottom-start" onHide={() => setShowCalendar(false)} rootClose>
                <Popover className="custom-calendar-popover">
                    <Popover.Body className="p-2">
                        <DayPicker
                            mode="single"
                            onDayClick={handleDayClick}
                            locale={currentLocale}
                            weekStartsOn={weekStartsOn}
                            disabled={{ before: minDate }}
                            fromMonth={minDate}
                            captionLayout="dropdown-buttons"
                            showOutsideDays
                            fixedWeeks
                            modifiers={modifiers}
                            modifiersClassNames={modifiersClassNames}
                            onDayMouseEnter={(day) => setHoveredDay(day)}
                            onDayMouseLeave={() => setHoveredDay(null)}
                        />
                    </Popover.Body>
                </Popover>
            </Overlay>
        </div>
    );
};

export default DatePicker;