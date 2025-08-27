// frontend/src/shared/ui/components/DatePicker/index.js
import React, { useEffect, useRef, useState } from 'react';
import { Card, Form, InputGroup, Overlay, Popover } from 'react-bootstrap';
import { endOfWeek, format, isValid, parse, startOfWeek } from 'date-fns';
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
                        displayMode = 'input', // 'input' | 'inline'
                        selectionMode = 'week', // 'week' | 'day'
                    }) => {
    const { locale } = useI18n();
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
    const currentLocale = localeMap[locale] || he;

    useEffect(() => {
        if (value && isValid(value)) {
            setSelectedDate(value);
            if (displayMode === 'input') {
                setInputValue(format(value, dateFormat));
            }
        } else {
            setSelectedDate(undefined);
            if (displayMode === 'input') {
                setInputValue('');
            }
        }
    }, [value, dateFormat, displayMode]);


    const handleDateSelect = (date) => {
        if (!date) return;
        const finalDate = selectionMode === 'week' ? startOfWeek(date, { weekStartsOn }) : date;
        setSelectedDate(finalDate);
        if (displayMode === 'input') {
            setInputValue(format(finalDate, dateFormat));
        }
        onChange(finalDate);
    };


    const handleDayClick = (date, modifiers) => {
        if (modifiers.disabled) return;
        handleDateSelect(date);
        if (displayMode === 'input') {
            setShowCalendar(false);
        }
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

    const modifiers = {};

    if (selectionMode === 'week') {
        if (selectedDate) {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn });
            modifiers.selected_week = { from: weekStart, to: weekEnd };
            modifiers.selected_week_start = weekStart;
            modifiers.selected_week_end = weekEnd;
        }
        if (hoveredDay) {
            const weekStart = startOfWeek(hoveredDay, { weekStartsOn });
            const weekEnd = endOfWeek(hoveredDay, { weekStartsOn });
            modifiers.hovered_week = { from: weekStart, to: weekEnd };
            modifiers.hovered_week_start = weekStart;
            modifiers.hovered_week_end = weekEnd;
        }
    }

    const modifiersClassNames = {
        hovered_week: 'rdp-day_modifier--hovered_week',
        hovered_week_start: 'rdp-day_modifier--hovered_week_start',
        hovered_week_end: 'rdp-day_modifier--hovered_week_end',
        today: 'rdp-day_today',
        selected_week: 'rdp-day_modifier--selected_week',
        selected_week_start: 'rdp-day_modifier--selected_week_start',
        selected_week_end: 'rdp-day_modifier--selected_week_end',

    };
    const CalendarComponent = (
        <DayPicker
            mode="single"
            selected={selectedDate}
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
            onDayMouseEnter={(day) => selectionMode === 'week' && setHoveredDay(day)}
            onDayMouseLeave={() => selectionMode === 'week' && setHoveredDay(null)}
        />
    );

    if (displayMode === 'inline') {
        return (
            <Card className={`custom-datepicker-inline custom-day-picker-wrapper ${className}`}>
                <Card.Body className="p-2">
                    {CalendarComponent}
                </Card.Body>
            </Card>
        );
    }

    // Поведение по умолчанию (с полем ввода)
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

            <Overlay show={showCalendar} target={inputRef.current} placement="bottom-start"
                     onHide={() => setShowCalendar(false)} rootClose>
                <Popover className="custom-calendar-popover custom-day-picker-wrapper">
                    <Popover.Body className="p-2">
                        {CalendarComponent}
                    </Popover.Body>
                </Popover>
            </Overlay>
        </div>
    );
};

export default DatePicker;