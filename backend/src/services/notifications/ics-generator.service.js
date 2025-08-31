// backend/src/services/ics-generator.service.js
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

function generateScheduleICS(employee, scheduleData) {
    const organizerEmail = process.env.COMPANY_EMAIL || 'scheduler@company.com';
    const prodId = '-//Company Name//Shift Scheduler//EN';

    const events = scheduleData.shifts.map(shift => {
        const uid = `${uuidv4()}@scheduler.company.com`;
        const startDate = dayjs(`${shift.date} ${shift.start_time}`);
        const endDate = startDate.add(shift.duration, 'hour');

        return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dayjs().format('YYYYMMDDTHHmmss')}Z
DTSTART:${startDate.format('YYYYMMDDTHHmmss')}
DTEND:${endDate.format('YYYYMMDDTHHmmss')}
SUMMARY:${shift.shift_name}
DESCRIPTION:Position: ${shift.position_name || 'TBD'}\\nSite: ${shift.site_name || 'TBD'}
LOCATION:${shift.site_address || ''}
ORGANIZER;CN=Shift Scheduler:mailto:${organizerEmail}
ATTENDEE;PARTSTAT=ACCEPTED;RSVP=FALSE;CN=${employee.first_name} ${employee.last_name}:mailto:${employee.email}
METHOD:REQUEST
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Shift reminder
END:VALARM
END:VEVENT`;
    }).join('\n');

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:${prodId}
CALSCALE:GREGORIAN
METHOD:REQUEST
${events}
END:VCALENDAR`;
}

module.exports = { generateScheduleICS };