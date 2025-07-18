// frontend/src/features/employee-archive/ui/CalendarView/CalendarView.js
import React from 'react';
import { Card, Dropdown } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import {
    formatMonthYear,
    getMonthDays,
    formatDayNumber,
    isToday,
    getDayNames,
    getShiftForDate,
    isSameDate,
    formatToIsoDate,
    formatToYearMonth
} from 'shared/lib/utils/scheduleUtils';
import './CalendarView.css';

const CalendarView = ({
                          selectedMonth,
                          onMonthChange,
                          monthData,
                          selectedDate,
                          onDateSelect,
                          availableMonths,
                          getShiftColor
                      }) => {
    const { t } = useI18n();

    const handlePreviousMonth = () => {
        const newMonth = new Date(selectedMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        onMonthChange(newMonth);
    };

    const handleNextMonth = () => {
        const newMonth = new Date(selectedMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        onMonthChange(newMonth);
    };

    const renderMonthSelector = () => {
        const currentMonthStr = formatToYearMonth(selectedMonth);

        return (
            <Dropdown>
                <Dropdown.Toggle variant="link" className="month-selector">
                    {formatMonthYear(selectedMonth)}
                </Dropdown.Toggle>
                <Dropdown.Menu className="month-dropdown-menu">
                    {availableMonths.map(monthStr => {
                        const [year, month] = monthStr.split('-').map(Number);
                        const date = new Date(year, month - 1);

                        return (
                            <Dropdown.Item
                                key={monthStr}
                                active={monthStr === currentMonthStr}
                                onClick={() => onMonthChange(date)}
                            >
                                {formatMonthYear(date)}
                            </Dropdown.Item>
                        );
                    })}
                </Dropdown.Menu>
            </Dropdown>
        );
    };

    const renderCalendar = () => {
        const days = getMonthDays(selectedMonth);
        const firstDayOfWeek = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
        const emptyCells = Array(firstDayOfWeek).fill(null);
        const weekDays = getDayNames(t, true);

        return (
            <div className="calendar-grid">
                {/* Week day headers */}
                {weekDays.map((day, index) => (
                    <div key={`weekday-${index}`} className="calendar-weekday">
                        {day}
                    </div>
                ))}

                {/* Empty cells */}
                {emptyCells.map((_, index) => (
                    <div key={`empty-${index}`} className="calendar-cell empty" />
                ))}

                {/* Days of the month */}
                {days.map(day => {
                    const dateStr = formatToIsoDate(day);
                    const shift = getShiftForDate(day, monthData?.shifts);
                    const isSelected = isSameDate(selectedDate, day);
                    const isTodayDate = isToday(day);
                    return (
                        <div
                            key={dateStr}
                            className={`calendar-cell ${isTodayDate ? 'today' : ''} ${isSelected ? 'selected' : ''} ${shift ? 'has-shift' : ''}`}
                            onClick={() => onDateSelect(day)}
                        >
                            <div className="calendar-date">{formatDayNumber(day)}</div>
                            {shift && (
                                <div
                                    className="shift-indicator"
                                    style={{ backgroundColor: getShiftColor({ shift_id: shift.shift_id, color: shift.color }) }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const isPreviousDisabled = () => {
        if (!availableMonths.length) return true;
        return availableMonths[0] === formatToYearMonth(selectedMonth);
    };

    const isNextDisabled = () => {
        if (!availableMonths.length) return true;
        return availableMonths[availableMonths.length - 1] === formatToYearMonth(selectedMonth);
    };

    return (
        <Card className="calendar-view">
            <Card.Header className="calendar-header">
                <button
                    className="nav-button"
                    onClick={handlePreviousMonth}
                    disabled={isPreviousDisabled()}
                >
                    <ChevronLeft />
                </button>

                {renderMonthSelector()}

                <button
                    className="nav-button"
                    onClick={handleNextMonth}
                    disabled={isNextDisabled()}
                >
                    <ChevronRight />
                </button>
            </Card.Header>

            <Card.Body>
                {renderCalendar()}
            </Card.Body>
        </Card>
    );
};

export default CalendarView;