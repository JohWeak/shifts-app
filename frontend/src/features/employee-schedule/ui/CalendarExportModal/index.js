// frontend/src/features/employee-schedule/ui/CalendarExportModal/index.js
import React, {useMemo, useState} from 'react';
import {Button, ButtonGroup, Form, Modal} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {CalendarExportService} from 'shared/lib/utils/calendarExport';
import {formatShiftTime} from 'shared/lib/utils/scheduleUtils';
import {parseISO} from 'date-fns';
import './CalendarExportModal.css';
import {CalendarLinkGenerator} from "shared/lib/utils/calendarLinks";

const CalendarExportModal = ({
                                 show,
                                 onHide,
                                 weekSchedule,
                             }) => {
    const {t, locale} = useI18n();
    const [selectedShifts, setSelectedShifts] = useState(new Set());
    const [includeLocation, setIncludeLocation] = useState(false);
    const [reminderMinutes, setReminderMinutes] = useState(15);
    const [calendarType, setCalendarType] = useState('google');

    // Platform detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // Extract shifts from week schedule
    const availableShifts = useMemo(() => {
        if (!weekSchedule?.schedule) return [];

        const shifts = [];
        weekSchedule.schedule.forEach(day => {
            if (day.shifts && Array.isArray(day.shifts)) {
                day.shifts.forEach(shift => {
                    // Check if current employee is assigned to this shift
                    const isAssigned = shift.employees?.some(e => e.is_current_user);

                    if (isAssigned) {
                        const employee = shift.employees.find(e => e.is_current_user);

                        shifts.push({
                            ...shift,
                            date: day.date,
                            day_of_week: day.day_of_week,
                            position_name: employee?.position,
                            site_name: shift.site_name || employee?.site_name,
                            site_address: shift.site_address || employee?.site_address,
                            uniqueKey: `${day.date}-${shift.shift_id}`
                        });
                    }
                });
            }
        });

        return shifts;
    }, [weekSchedule]);

    // Reminder options matching iOS/Android standards
    const reminderOptions = [
        {value: null, label: t('calendar.export.noReminder')},
        {value: 0, label: t('calendar.export.atEventTime')},
        {value: 5, label: t('calendar.export.minutes', {count: 5})},
        {value: 10, label: t('calendar.export.minutes', {count: 10})},
        {value: 15, label: t('calendar.export.minutes', {count: 15})},
        {value: 30, label: t('calendar.export.minutes', {count: 30})},
        {value: 60, label: t('calendar.export.hours', {count: 1})},
        {value: 120, label: t('calendar.export.hours', {count: 2})},
    ];

    const handleShiftToggle = (shiftKey) => {
        const newSelected = new Set(selectedShifts);
        if (newSelected.has(shiftKey)) {
            newSelected.delete(shiftKey);
        } else {
            newSelected.add(shiftKey);
        }
        setSelectedShifts(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedShifts.size === availableShifts.length) {
            setSelectedShifts(new Set());
        } else {
            setSelectedShifts(new Set(availableShifts.map(s => s.uniqueKey)));
        }
    };

    const handleAddToCalendar = () => {
        const shiftsToExport = availableShifts.filter(shift =>
            selectedShifts.has(shift.uniqueKey)
        );

        if (shiftsToExport.length === 0) return;

        // For single shift - open directly in calendar
        if (shiftsToExport.length === 1) {
            const shift = shiftsToExport[0];
            let url;

            switch (calendarType) {
                case 'google':
                    url = CalendarLinkGenerator.generateGoogleCalendarLink(shift);
                    break;
                case 'apple':
                    // For Apple, generate ICS and use data URL
                    const icsContent = CalendarExportService.generateICS([shift], {
                        includeLocation,
                        reminderMinutes,
                        locale
                    });
                    const blob = new Blob([icsContent], {type: 'text/calendar'});
                    url = URL.createObjectURL(blob);
                    break;
                case 'outlook':
                    url = CalendarLinkGenerator.generateOutlookLink(shift);
                    break;
                default:
                    // Download ICS file
                    const defaultIcs = CalendarExportService.generateICS([shift], {
                        includeLocation,
                        reminderMinutes,
                        locale
                    });
                    CalendarExportService.downloadICS(defaultIcs, `shift_${shift.date}.ics`);
                    return;
            }

            window.open(url, '_blank');
        } else {
            // For multiple shifts, generate ICS file
            const icsContent = CalendarExportService.generateICS(shiftsToExport, {
                includeLocation,
                reminderMinutes,
                locale
            });

            // If Google Calendar, try to import via URL
            if (calendarType === 'google' && shiftsToExport.length <= 5) {
                // Google Calendar has limits, so for few events open them one by one
                shiftsToExport.forEach((shift, index) => {
                    setTimeout(() => {
                        const url = CalendarLinkGenerator.generateGoogleCalendarLink(shift);
                        window.open(url, '_blank');
                    }, index * 1000); // Delay to avoid popup blocker
                });
            } else {
                // For many events or other calendars, download ICS
                CalendarExportService.downloadICS(icsContent, `schedule_${weekSchedule.week.start}.ics`);
            }
        }

        // Close modal after short delay
        setTimeout(() => {
            onHide();
            setSelectedShifts(new Set());
            setIncludeLocation(false);
        }, 500);
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-calendar-plus me-2"></i>
                    {t('calendar.export.title')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Calendar type selection */}
                <div className="mb-3">
                    <Form.Label>{t('calendar.export.selectCalendarType')}</Form.Label>
                    <ButtonGroup className="w-100">
                        <Button
                            variant={calendarType === 'google' ? 'primary' : 'outline-primary'}
                            onClick={() => setCalendarType('google')}
                        >
                            <i className="bi bi-google me-2"></i>
                            Google
                        </Button>
                        {isIOS && (
                            <Button
                                variant={calendarType === 'apple' ? 'primary' : 'outline-primary'}
                                onClick={() => setCalendarType('apple')}
                            >
                                <i className="bi bi-apple me-2"></i>
                                Apple
                            </Button>
                        )}
                        <Button
                            variant={calendarType === 'outlook' ? 'primary' : 'outline-primary'}
                            onClick={() => setCalendarType('outlook')}
                        >
                            <i className="bi bi-microsoft me-2"></i>
                            Outlook
                        </Button>
                        <Button
                            variant={calendarType === 'ics' ? 'primary' : 'outline-primary'}
                            onClick={() => setCalendarType('ics')}
                        >
                            <i className="bi bi-file-earmark-arrow-down me-2"></i>
                            {t('calendar.export.downloadICS')}
                        </Button>
                    </ButtonGroup>
                </div>

                {/* Shift selection */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6>{t('calendar.export.selectShifts')}</h6>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={handleSelectAll}
                        >
                            {selectedShifts.size === availableShifts.length
                                ? t('common.deselectAll')
                                : t('common.selectAll')
                            }
                        </Button>
                    </div>

                    <div className="shift-selection-list">
                        {availableShifts.map(shift => {
                            const dateObj = parseISO(shift.date);
                            return (
                                <Form.Check
                                    key={shift.uniqueKey}
                                    type="checkbox"
                                    id={`shift-${shift.uniqueKey}`}
                                    className="shift-selection-item"
                                    checked={selectedShifts.has(shift.uniqueKey)}
                                    onChange={() => handleShiftToggle(shift.uniqueKey)}
                                    label={
                                        <div className="shift-label">
                                            <strong>{shift.shift_name}</strong>
                                            <span className="ms-2 text-muted">
                            {dateObj.toLocaleDateString(locale)} •
                                                {formatShiftTime(shift.start_time, shift.duration)}
                          </span>
                                            {shift.site_name && (
                                                <span className="ms-2 text-muted">
                              <i className="bi bi-building ms-1"></i> {shift.site_name}
                            </span>
                                            )}
                                        </div>
                                    }
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Options */}
                {calendarType !== 'google' && calendarType !== 'outlook' && (
                    <>
                        <hr/>
                        <div className="mb-3">
                            <Form.Check
                                type="switch"
                                id="include-location"
                                label={t('calendar.export.includeLocation')}
                                checked={includeLocation}
                                onChange={(e) => setIncludeLocation(e.target.checked)}
                            />
                        </div>

                        <div className="mb-3">
                            <Form.Label>{t('calendar.export.reminder')}</Form.Label>
                            <Form.Select
                                value={reminderMinutes}
                                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                            >
                                {reminderOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {t('common.cancel')}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleAddToCalendar}
                    disabled={selectedShifts.size === 0}
                >
                    <i className="bi bi-calendar-plus me-2"></i>
                    {t('calendar.export.addToCalendar')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CalendarExportModal;