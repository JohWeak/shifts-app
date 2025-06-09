// backend/src/utils/pdfGenerator.js
const puppeteer = require('puppeteer');

class PDFGenerator {
    constructor(language = 'en') {
        this.language = language;
        this.messages = this.getMessages(language);
    }

    getMessages(lang) {
        const messages = {
            en: {
                WORK_SCHEDULE_TITLE: 'Work Schedule',
                GENERATED_ON: 'Generated on',
                SITE_LABEL: 'Site',
                WEEK_LABEL: 'Week',
                STATUS_LABEL: 'Status',
                TOTAL_ASSIGNMENTS_LABEL: 'Total Assignments',
                EMPLOYEE_HEADER: 'Employee',
                POSITION_HEADER: 'Position',
                SHIFT_HEADER: 'Shift',
                TIME_HEADER: 'Time',
                STATUS_HEADER: 'Status',
                SYSTEM_NAME: 'Work Schedule Management System',
                EXPORT_ID_LABEL: 'Export ID',
                GENERATED_LABEL: 'Generated',
                NO_ASSIGNMENTS: 'No assignments for this day',
                PDF_GENERATION_ERROR: 'Failed to generate PDF'
            }
        };
        return messages[lang] || messages.en;
    }

    async generateSchedulePDF(data, options = {}) {
        let browser;

        try {
            console.log('[PDFGenerator] Starting PDF generation...');

            // Launch browser with optimized settings
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();

            // Set viewport for consistent rendering
            await page.setViewport({
                width: 1200,
                height: 800,
                deviceScaleFactor: 1
            });

            console.log('[PDFGenerator] Generating HTML content...');
            // Generate HTML content
            const htmlContent = this.generateScheduleHTML(data);

            // Set content and wait for fonts/styles to load
            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            console.log('[PDFGenerator] Converting to PDF...');
            // Generate PDF with custom options
            const pdfOptions = {
                format: 'A4',
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                printBackground: true,
                preferCSSPageSize: true,
                ...options
            };

            const pdfBuffer = await page.pdf(pdfOptions);
            console.log('[PDFGenerator] PDF generated successfully');

            return pdfBuffer;

        } catch (error) {
            console.error('[PDFGenerator] Generation error:', error);
            throw new Error(`${this.messages.PDF_GENERATION_ERROR}: ${error.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    generateScheduleHTML(data) {
        // Group assignments by date for better organization
        const assignmentsByDate = this.groupAssignmentsByDate(data.assignments);
        const sortedDates = Object.keys(assignmentsByDate).sort((a, b) =>
            new Date(a) - new Date(b)
        );

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${this.messages.WORK_SCHEDULE_TITLE} - ${data.schedule.site}</title>
            <style>
                ${this.getStylesheet()}
            </style>
        </head>
        <body>
            ${this.generateHeader(data)}
            ${this.generateInfoSection(data)}
            ${this.generateScheduleContent(sortedDates, assignmentsByDate)}
            ${this.generateFooter(data)}
        </body>
        </html>
        `;
    }

    groupAssignmentsByDate(assignments) {
        return assignments.reduce((acc, assignment) => {
            // Fix date parsing - ensure we get a valid date string
            let dateStr;
            try {
                const date = new Date(assignment.date);
                if (isNaN(date.getTime())) {
                    // If date is invalid, try different parsing
                    dateStr = assignment.date;
                } else {
                    dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
                }
            } catch (error) {
                console.warn('[PDFGenerator] Date parsing error:', error, assignment.date);
                dateStr = assignment.date;
            }

            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(assignment);
            return acc;
        }, {});
    }

    generateHeader(data) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
        <div class="header">
            <h1>${this.messages.WORK_SCHEDULE_TITLE}</h1>
            <div class="subtitle">${this.messages.GENERATED_ON} ${currentDate}</div>
        </div>
        `;
    }

    generateInfoSection(data) {
        return `
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">${this.messages.SITE_LABEL}:</span>
                <span>${data.schedule.site}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.messages.WEEK_LABEL}:</span>
                <span>${data.schedule.week}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.messages.STATUS_LABEL}:</span>
                <span class="status-badge status-${data.schedule.status}">
                    ${data.schedule.status}
                </span>
            </div>
            <div class="info-item">
                <span class="info-label">${this.messages.TOTAL_ASSIGNMENTS_LABEL}:</span>
                <span>${data.assignments.length}</span>
            </div>
        </div>
        `;
    }

    generateScheduleContent(sortedDates, assignmentsByDate) {
        return sortedDates.map(dateStr => {
            const assignments = assignmentsByDate[dateStr];

            // Format date for display
            let formattedDate;
            try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } else {
                    formattedDate = dateStr; // Fallback to original string
                }
            } catch (error) {
                console.warn('[PDFGenerator] Date formatting error:', error);
                formattedDate = dateStr;
            }

            return `
            <div class="day-section">
                <div class="day-header">${formattedDate}</div>
                ${assignments.length > 0 ?
                this.generateAssignmentsTable(assignments) :
                this.generateNoAssignmentsMessage()
            }
            </div>
            `;
        }).join('');
    }

    generateAssignmentsTable(assignments) {
        // Sort assignments by shift time
        const sortedAssignments = assignments.sort((a, b) =>
            a.shift_time.localeCompare(b.shift_time)
        );

        const tableRows = sortedAssignments.map(assignment => `
            <tr>
                <td class="employee-name">${assignment.employee}</td>
                <td>
                    <span class="position-badge">${assignment.position}</span>
                </td>
                <td>${assignment.shift}</td>
                <td class="shift-time">${assignment.shift_time}</td>
                <td>${assignment.status}</td>
            </tr>
        `).join('');

        return `
        <table class="assignments-table">
            <thead>
                <tr>
                    <th>${this.messages.EMPLOYEE_HEADER}</th>
                    <th>${this.messages.POSITION_HEADER}</th>
                    <th>${this.messages.SHIFT_HEADER}</th>
                    <th>${this.messages.TIME_HEADER}</th>
                    <th>${this.messages.STATUS_HEADER}</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
        `;
    }

    generateNoAssignmentsMessage() {
        return `
        <div class="no-assignments">
            ${this.messages.NO_ASSIGNMENTS}
        </div>
        `;
    }

    generateFooter(data) {
        const timestamp = new Date().toISOString();

        return `
        <div class="footer">
            <p>${this.messages.SYSTEM_NAME}</p>
            <p>${this.messages.EXPORT_ID_LABEL}: ${data.schedule.id} | ${this.messages.GENERATED_LABEL}: ${timestamp}</p>
        </div>
        `;
    }

    getStylesheet() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #007bff;
            }
            
            .header h1 {
                color: #007bff;
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .header .subtitle {
                color: #666;
                font-size: 14px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .info-item {
                display: flex;
                align-items: center;
            }
            
            .info-label {
                font-weight: bold;
                margin-right: 10px;
                color: #495057;
            }
            
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .status-published {
                background: #d4edda;
                color: #155724;
            }
            
            .status-draft {
                background: #fff3cd;
                color: #856404;
            }
            
            .day-section {
                margin-bottom: 25px;
                break-inside: avoid;
            }
            
            .day-header {
                background: #007bff;
                color: white;
                padding: 12px 16px;
                font-weight: bold;
                font-size: 14px;
                border-radius: 8px 8px 0 0;
            }
            
            .assignments-table {
                width: 100%;
                border-collapse: collapse;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-radius: 0 0 8px 8px;
                overflow: hidden;
            }
            
            .assignments-table th {
                background: #e9ecef;
                padding: 12px 8px;
                text-align: left;
                font-weight: bold;
                font-size: 11px;
                text-transform: uppercase;
                color: #495057;
                border-bottom: 1px solid #dee2e6;
            }
            
            .assignments-table td {
                padding: 10px 8px;
                border-bottom: 1px solid #dee2e6;
                vertical-align: top;
            }
            
            .assignments-table tr:nth-child(even) {
                background: #f8f9fa;
            }
            
            .assignments-table tr:hover {
                background: #e3f2fd;
            }
            
            .shift-time {
                font-family: 'Courier New', monospace;
                color: #6c757d;
                font-size: 11px;
            }
            
            .employee-name {
                font-weight: bold;
                color: #495057;
            }
            
            .position-badge {
                background: #e3f2fd;
                color: #1976d2;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
            }
            
            .no-assignments {
                text-align: center;
                padding: 20px;
                color: #6c757d;
                font-style: italic;
                background: #f8f9fa;
            }
            
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                text-align: center;
                color: #6c757d;
                font-size: 11px;
            }
            
            @media print {
                .day-section {
                    page-break-inside: avoid;
                }
            }
        `;
    }
}

module.exports = PDFGenerator;