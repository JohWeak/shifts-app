// frontend/src/shared/lib/utils/calendarExport.js
import {addMinutes, format, parseISO} from 'date-fns';
import {translateShiftName} from './scheduleUtils';

/**
 * Generates ICS file content for calendar events
 */
export class CalendarExportService {
    /**
     * Create ICS file content from shift data
     * @param {Array} shifts - Array of shift objects to export
     * @param {Object} options - Export options
     * @returns {string} ICS file content
     */
    static generateICS(shifts, options = {}) {
        const {
            includeLocation = false,
            reminderMinutes = null,
            locale = 'en'
        } = options;

        const events = shifts.map(shift => this.createVEvent(shift, {
            includeLocation,
            reminderMinutes,
            locale
        }));

        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//ShiftScheduler//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            ...events.flat(),
            'END:VCALENDAR'
        ].join('\r\n');
    }

    /**
     * Create VEVENT component for a shift
     */
    static createVEvent(shift, options) {
        const {includeLocation, reminderMinutes, locale} = options;

        // Parse dates and times
        const startDate = parseISO(shift.date);
        const [hours, minutes] = shift.start_time.split(':').map(Number);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = addMinutes(startDate, shift.duration * 60); // duration is in hours

        // Generate unique ID
        const uid = `shift-${shift.shift_id}-${shift.date}@shiftscheduler`;

        // Format dates for ICS
        const dtstart = this.formatDateTimeForICS(startDate);
        const dtend = this.formatDateTimeForICS(endDate);
        const dtstamp = this.formatDateTimeForICS(new Date());

        // Translate shift name if needed
        const translatedShiftName = translateShiftName(shift.shift_name, locale);

        const event = [
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART:${dtstart}`,
            `DTEND:${dtend}`,
            `SUMMARY:${this.escapeText(translatedShiftName)}`,
        ];

        // Add description if position or site info available
        const descriptionParts = [];
        if (shift.position_name) {
            descriptionParts.push(this.getLocalizedLabel('position', locale) + ': ' + shift.position_name);
        }
        if (shift.site_name) {
            descriptionParts.push(this.getLocalizedLabel('site', locale) + ': ' + shift.site_name);
        }

        if (descriptionParts.length > 0) {
            event.push(`DESCRIPTION:${this.escapeText(descriptionParts.join('\\n'))}`);
        }

        // Add location if requested and available
        if (includeLocation && shift.site_address) {
            event.push(`LOCATION:${this.escapeText(shift.site_address)}`);
        }

        // Add reminder/alarm if specified
        if (reminderMinutes !== null && reminderMinutes > 0) {
            event.push(
                'BEGIN:VALARM',
                'TRIGGER:-PT' + reminderMinutes + 'M',
                'ACTION:DISPLAY',
                `DESCRIPTION:${this.escapeText(translatedShiftName)} - ${this.getLocalizedLabel('reminder', locale)}`,
                'END:VALARM'
            );
        }

        event.push('END:VEVENT');

        return event;
    }

    /**
     * Get localized label for description fields
     */
    static getLocalizedLabel(key, locale) {
        const labels = {
            en: {
                position: 'Position',
                site: 'Site',
                reminder: 'Reminder'
            },
            ru: {
                position: 'Должность',
                site: 'Рабочее место',
                reminder: 'Напоминание'
            },
            he: {
                position: 'תפקיד',
                site: 'אתר',
                reminder: 'תזכורת'
            }
        };

        return labels[locale]?.[key] || labels.en[key];
    }

    /**
     * Format date/time for ICS format (YYYYMMDDTHHMMSS)
     */
    static formatDateTimeForICS(date) {
        return format(date, "yyyyMMdd'T'HHmmss");
    }

    /**
     * Escape text for ICS format
     */
    static escapeText(text) {
        if (!text) return '';
        return text
            .replace(/\\/g, '\\\\')
            .replace(/,/g, '\\,')
            .replace(/;/g, '\\;')
            .replace(/\n/g, '\\n');
    }

    /**
     * Download or open ICS file depending on platform
     */
    static downloadICS(content, filename = 'schedule.ics') {
        const blob = new Blob([content], {type: 'text/calendar;charset=utf-8'});

        // Check if we're on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        // Check if we're on Android
        const isAndroid = /Android/.test(navigator.userAgent);

        if (isIOS || isAndroid) {
            // For mobile devices, use data URL to trigger calendar app
            const reader = new FileReader();
            reader.onload = function (e) {
                // Create a data URL
                const dataUrl = e.target.result.replace(
                    'data:application/octet-stream',
                    'data:text/calendar'
                );

                if (isIOS) {
                    // For iOS, open in same window - this triggers the calendar dialog
                    window.location.href = dataUrl;
                } else {
                    // For Android, try to open in new window first
                    const newWindow = window.open(dataUrl, '_blank');

                    // If popup blocked, fallback to location.href
                    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                        window.location.href = dataUrl;
                    }
                }
            };
            reader.readAsDataURL(blob);
        } else {
            // For desktop, use traditional download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            // Some browsers need the link to be in the body
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        }
    }

    /**
     * Alternative method using base64 encoding for better iOS support
     */
    static openICSInCalendar(content) {
        // Convert to base64
        const base64 = btoa(unescape(encodeURIComponent(content)));

        // Create data URL with base64 encoding
        const dataUrl = `data:text/calendar;base64,${base64}`;

        // Check platform
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isAndroid = /Android/.test(navigator.userAgent);

        if (isIOS) {
            // iOS: Direct navigation works best
            window.location.href = dataUrl;
        } else if (isAndroid) {
            // Android: Try intent first
            const intentUrl = `intent://calendar#Intent;scheme=data;type=text/calendar;S.content=${encodeURIComponent(content)};end`;
            window.location.href = intentUrl;

            // Fallback to data URL after a short delay if intent doesn't work
            setTimeout(() => {
                window.location.href = dataUrl;
            }, 500);
        } else {
            // Desktop: Download the file
            const blob = new Blob([content], {type: 'text/calendar;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'schedule.ics';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

}