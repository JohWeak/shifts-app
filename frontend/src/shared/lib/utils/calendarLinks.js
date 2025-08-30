// frontend/src/shared/lib/utils/calendarLinks.js
import {addMinutes, format, parseISO} from 'date-fns';

export class CalendarLinkGenerator {
    /**
     * Generate Google Calendar link
     */
    static generateGoogleCalendarLink(shift) {
        const startDate = parseISO(shift.date);
        const [hours, minutes] = shift.start_time.split(':').map(Number);
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, shift.duration * 60);

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: shift.shift_name,
            dates: `${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}`,
            details: `Position: ${shift.position_name || ''}\nSite: ${shift.site_name || ''}`,
            location: shift.site_address || '',
            ctz: 'Asia/Jerusalem'
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    /**
     * Generate Apple Calendar webcal link (works on iOS)
     */
    static generateAppleCalendarLink(icsContent) {
        // This requires server-side support to serve the ICS file
        // We'll implement this next
        const encodedContent = encodeURIComponent(icsContent);
        return `/api/calendar/webcal?content=${encodedContent}`;
    }

    /**
     * Generate Outlook Web link
     */
    static generateOutlookLink(shift) {
        const startDate = parseISO(shift.date);
        const [hours, minutes] = shift.start_time.split(':').map(Number);
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, shift.duration * 60);

        const params = new URLSearchParams({
            path: '/calendar/action/compose',
            rru: 'addevent',
            subject: shift.shift_name,
            startdt: startDate.toISOString(),
            enddt: endDate.toISOString(),
            location: shift.site_address || '',
            body: `Position: ${shift.position_name || ''}\nSite: ${shift.site_name || ''}`
        });

        return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    }
}