// frontend/src/shared/ui/components/DatePicker/DatePicker.js
import React, { useState, useRef, useEffect } from 'react';
import { Form, InputGroup, Overlay, Popover } from 'react-bootstrap';
import { format, parse, isValid } from 'date-fns';
import { enUS, he, ru } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './DatePicker.css';

const DatePicker = ({
                        value,
                        onChange,
                        minDate = new Date(),
                        placeholder = 'Select date',
                        dateFormat = 'dd.MM.yyyy',
                        disabled = false,
                        className = '',
                        isInvalid = false,
                    }) => {
    const { language } = useI18n();
    const [showCalendar, setShowCalendar] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedDate, setSelectedDate] = useState(value);
    const inputRef = useRef(null);

    const localeMap = {
        en: enUS,
        he: he,
        ru: ru,
    };
    const currentLocale = localeMap[language] || enUS;

    // Синхронизация внешнего значения с внутренним
    useEffect(() => {
        if (value) {
            if (isValid(value)) {
                setSelectedDate(value);
                setInputValue(format(value, dateFormat));
            }
        } else {
            // Если внешнее значение сброшено, сбрасываем и внутреннее
            setSelectedDate(undefined);
            setInputValue('');
        }
    }, [value, dateFormat]);


    const handleDaySelect = (date) => {
        if (!date) return;
        setSelectedDate(date);
        setInputValue(format(date, dateFormat));
        onChange(date);
        setShowCalendar(false);
    };

    const handleInputChange = (e) => {
        const str = e.target.value;
        setInputValue(str);
        const parsedDate = parse(str, dateFormat, new Date());
        if (isValid(parsedDate)) {
            setSelectedDate(parsedDate);
            onChange(parsedDate);
        }
    };

    const handleInputClick = () => {
        if (!disabled) {
            setShowCalendar(true);
        }
    };

    // Модификатор для отключения дней до minDate
    const disabledDays = { before: minDate };

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
                    readOnly // Рекомендуется, чтобы избежать ручного ввода невалидных форматов
                />
                <InputGroup.Text>
                    <i className="bi bi-calendar3"></i>
                </InputGroup.Text>
            </InputGroup>

            <Overlay
                show={showCalendar}
                target={inputRef.current}
                placement="bottom-start"
                onHide={() => setShowCalendar(false)}
                rootClose // Закрывать при клике вне
            >
                <Popover className="custom-calendar-popover">
                    <Popover.Body className="p-2">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDaySelect}
                            locale={currentLocale}
                            disabled={disabledDays}
                            fromMonth={minDate} // Нельзя перейти к месяцам до minDate
                            // Пропсы для навигации с выбором месяца/года
                            captionLayout="dropdown-buttons"
                            showOutsideDays
                            fixedWeeks

                        />
                    </Popover.Body>
                </Popover>
            </Overlay>
        </div>
    );
};

export default DatePicker;