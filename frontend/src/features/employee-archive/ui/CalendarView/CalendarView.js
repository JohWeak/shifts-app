// frontend/src/features/employee-archive/ui/CalendarView/CalendarView.js
import React, {useEffect} from 'react';
import { Card, Dropdown } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
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
    const { t, locale } = useI18n();

    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    if (!isPreviousDisabled()) {
                        handlePreviousMonth();
                    }
                    break;
                case 'ArrowRight':
                    if (!isNextDisabled()) {
                        handleNextMonth();
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedMonth, availableMonths]);

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
        const currentMonthStr = format(selectedMonth, 'yyyy-MM');

        return (
            <Dropdown>
                <Dropdown.Toggle variant="link" className="month-selector">
                    {format(selectedMonth, 'MMMM yyyy', { locale })}
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
                                {format(date, 'MMMM yyyy', { locale })}
                            </Dropdown.Item>
                        );
                    })}
                </Dropdown.Menu>
            </Dropdown>
        );
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Get the first day of the week (0 = Sunday, 1 = Monday, etc.)
        const firstDayOfWeek = monthStart.getDay();

        // Add empty cells for days before the month starts
        const emptyCells = Array(firstDayOfWeek).fill(null);

        const weekDays = [
            t('calendar.weekDays.sun'),
            t('calendar.weekDays.mon'),
            t('calendar.weekDays.tue'),
            t('calendar.weekDays.wed'),
            t('calendar.weekDays.thu'),
            t('calendar.weekDays.fri'),
            t('calendar.weekDays.sat')
        ];

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
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const shift = monthData?.shifts?.find(s => s.work_date === dateStr);
                    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
                    const hasShift = !!shift;

                    return (
                        <div
                            key={dateStr}
                            className={`calendar-cell ${isToday(day) ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasShift ? 'has-shift' : ''}`}
                            onClick={() => onDateSelect(day)}
                        >
                            <div className="calendar-date">{format(day, 'd')}</div>
                            {hasShift && (
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
        const currentMonthStr = format(selectedMonth, 'yyyy-MM');
        return availableMonths[0] === currentMonthStr;
    };

    const isNextDisabled = () => {
        if (!availableMonths.length) return true;
        const currentMonthStr = format(selectedMonth, 'yyyy-MM');
        return availableMonths[availableMonths.length - 1] === currentMonthStr;
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