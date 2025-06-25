// backend/src/controllers/schedule/schedule-export.controller.js
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const db = require('../../../models');
const {
    Schedule,
    ScheduleAssignment,
    Employee,
    Shift,
    Position,
    WorkSite
} = db;

let PDFGenerator = null;

const exportSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { format = 'pdf', lang = 'en' } = req.query;

        const schedule = await Schedule.findByPk(scheduleId, {
            include: [
                {
                    model: ScheduleAssignment,
                    as: 'assignments',
                    include: [
                        {
                            model: Employee,
                            as: 'employee',
                            attributes: ['emp_id', 'first_name', 'last_name']
                        },
                        {
                            model: Shift,
                            as: 'shift',
                            attributes: ['shift_id', 'shift_name', 'start_time', 'duration']
                        },
                        {
                            model: Position,
                            as: 'position',
                            attributes: ['pos_id', 'pos_name']
                        }
                    ]
                },
                {
                    model: WorkSite,
                    as: 'workSite',
                    attributes: ['site_id', 'site_name']
                }
            ]
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        const exportData = {
            schedule: {
                id: schedule.id,
                week: `${schedule.start_date.toISOString().split('T')[0]} to ${schedule.end_date.toISOString().split('T')[0]}`,
                site: schedule.workSite?.site_name || 'Unknown',
                status: schedule.status,
                created: schedule.createdAt
            },
            assignments: schedule.assignments.map(assignment => ({
                date: assignment.work_date,
                employee: `${assignment.employee.first_name} ${assignment.employee.last_name}`,
                shift: assignment.shift.shift_name,
                shift_time: assignment.shift.start_time,
                position: assignment.position.pos_name,
                status: assignment.status
            }))
        };

        if (format === 'csv') {
            const fields = ['date', 'employee', 'shift', 'shift_time', 'position', 'status'];
            const csv = [
                fields.join(','),
                ...exportData.assignments.map(row =>
                    fields.map(field => `"${row[field]}"`).join(',')
                )
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="schedule-${scheduleId}.csv"`);
            return res.send(csv);
        }

        if (format === 'pdf') {
            if (!PDFGenerator) {
                PDFGenerator = require('../../../utils/pdfGenerator');
            }

            const pdfGenerator = new PDFGenerator(lang);
            const pdfBuffer = await pdfGenerator.generateSchedulePDF(exportData);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="schedule-${scheduleId}.pdf"`);
            return res.send(pdfBuffer);
        }

        res.json({
            success: true,
            data: exportData
        });

    } catch (error) {
        console.error('[ScheduleController] Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

const getScheduleStats = async (req, res) => {
    try {
        const { timeframe = '30' } = req.query;
        const startDate = dayjs().subtract(parseInt(timeframe), 'day').toDate();

        const totalSchedules = await Schedule.count();
        const recentSchedules = await Schedule.count({
            where: {
                createdAt: { [Op.gte]: startDate }
            }
        });

        const publishedSchedules = await Schedule.count({
            where: { status: 'published' }
        });

        const draftSchedules = await Schedule.count({
            where: { status: 'draft' }
        });

        const totalAssignments = await ScheduleAssignment.count();
        const recentAssignments = await ScheduleAssignment.count({
            where: {
                createdAt: { [Op.gte]: startDate }
            }
        });

        res.json({
            success: true,
            data: {
                overview: {
                    total_schedules: totalSchedules,
                    recent_schedules: recentSchedules,
                    published_schedules: publishedSchedules,
                    draft_schedules: draftSchedules,
                    total_assignments: totalAssignments,
                    recent_assignments: recentAssignments
                },
                timeframe_days: parseInt(timeframe)
            }
        });

    } catch (error) {
        console.error('[ScheduleController] Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    exportSchedule,
    getScheduleStats
};