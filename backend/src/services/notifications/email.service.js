// backend/src/services/email.service.js
const nodemailer = require('nodemailer');
const {generateScheduleICS} = require('./ics-generator.service');
const {format, parseISO, isValid} = require('date-fns');
const i18n = require('../common/i18n.service');
const juice = require('juice');
const {enUS, ru, he} = require('date-fns/locale');
const dateFnsLocales = {
    en: enUS,
    ru: ru,
    he: he,
};

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendScheduleNotification(employee, scheduleData, globalNotificationSettings = {}) {

        // If admin disabled global notifications, skip all emails regardless of user preference
        if (globalNotificationSettings.notifySchedulePublished === false) {
            console.log(
                `Skipping email for ${employee.first_name} ${employee.last_name} - Admin disabled global notifications`);
            return;
        }

        // If global notifications enabled, check user preference
        if (!employee.email || !employee.receive_schedule_emails) {
            console.log(
                `Skipping email for ${employee.first_name} ${employee.last_name} \n 
                 Email? - ${!!employee.email} \n
                 Receive emails? - ${!!employee.receive_schedule_emails} \n
                 `);
            return;
        }
        const locale = employee.locale || 'en';
        const t = i18n.getFixedT(locale);
        const weekRange = this.formatWeekRange(scheduleData.week, locale);


        const icsContent = generateScheduleICS(employee, scheduleData);

        const htmlContent = this.generateEmailHTML(employee, scheduleData, t, locale);
        //Converting CSS to Inline Styles for Outlook and Other Clients
        const inlinedHtml = juice(htmlContent);

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Company Name" <noreply@company.com>',
            to: employee.email,
            subject: t('email.subject', {weekRange}),
            html: inlinedHtml,
            icalEvent: {
                method: 'REQUEST',
                content: icsContent,
            },
            alternatives: [{
                contentType: 'text/calendar; charset=UTF-8; method=REQUEST',
                content: icsContent,
            }],
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✅Schedule email sent to ${employee.email} in [${locale}]`);
            return {to: employee.email, status: 'sent'};
        } catch (error) {
            console.error(`❌Failed to send email to ${employee.email}:`, error);
            return {to: employee.email, status: 'failed', error: error.message};
        }
    }

    /**
     * --- WEEK FORMATTING FUNCTION ---
     * Formats the date range of the week by correctly handling Date strings and objects.
     * @param {object} week - An object with start and end fields.
     * @param {string} localeCode - Locale code ('en', 'ru', 'he').
     * @returns {string} - Formatted string, e.g. "Aug 24 - Aug 30, 2025".
     */
    formatWeekRange(week, localeCode) {
        const locale = dateFnsLocales[localeCode] || enUS;
        try {
            const start = (week.start instanceof Date) ? week.start : parseISO(week.start);
            const end = (week.end instanceof Date) ? week.end : parseISO(week.end);

            if (!isValid(start) || !isValid(end)) {
                return `${week.start} to ${week.end}`;
            }

            let startFormat, endFormat;

            if (start.getFullYear() === end.getFullYear()) {
                startFormat = format(start, 'MMM d', {locale});
                endFormat = format(end, 'MMM d, yyyy', {locale});
            } else {
                startFormat = format(start, 'MMM d, yyyy', {locale});
                endFormat = format(end, 'MMM d, yyyy', {locale});
            }

            return `${startFormat} - ${endFormat}`;

        } catch (error) {
            console.error('Error formatting week range:', error);
            return `${week.start} - ${week.end}`;
        }
    }


    generateEmailHTML(employee, scheduleData, t, localeCode) {
        const weekRange = this.formatWeekRange(scheduleData.week, localeCode);
        const locale = dateFnsLocales[localeCode] || enUS;
        //All CSS is in the <style>. Juice will transfer it to inline styles.
        return `
          <!DOCTYPE html>
          <html lang="${localeCode}" dir="${localeCode === 'he' ? 'rtl' : 'ltr'}">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${t('email.subject', {weekRange})}</title>
              <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; margin-top: 15px; }
                th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h2>${t('email.greeting', {name: employee.first_name})}</h2>
              <p>${t('email.published', {weekRange})}</p>
              
              <h3>${t('email.shifts_title')}</h3>
              <table>
                <thead>
                  <tr>
                    <th>${t('email.table_header_date')}</th>
                    <th>${t('email.table_header_shift')}</th>
                    <th>${t('email.table_header_time')}</th>
                    <th>${t('email.table_header_location')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${scheduleData.shifts.map(shift => {
            const formattedDate = format(parseISO(shift.date), 'EEE, dd/MM', {locale});
            const startTime = shift.start_time.substring(0, 5);
            const endTime = shift.end_time.substring(0, 5);

            return `
                      <tr>
                        <td>${formattedDate}</td>
                        <td>${shift.shift_name}</td>
                        <td>${startTime} - ${endTime}</td>
                        <td>${shift.site_name || 'TBD'}</td>
                      </tr>
                    `;
        }).join('')}
                </tbody>
              </table>
              
              <p style="margin-top: 20px;">
                <strong>${t('email.instructions_title')}</strong><br>
                • ${t('email.instructions_ios')}<br>
                • ${t('email.instructions_android')}<br>
                • ${t('email.instructions_desktop')}
              </p>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                ${t('email.preferences_note')}
              </p>
            </body>
          </html>
        `;
    }
}

module.exports = new EmailService();