// backend/src/models/scheduling/index.js
const Shift = require('./shift.model');
const Position = require('./position.model');
const Schedule = require('./schedule.model');
const SchedulePeriod = require('./schedule-period.model');
const ScheduleSettings = require('./schedule-settings.model');
const WorkDay = require('./workday.model');

module.exports = {
    Shift,
    Position,
    Schedule,
    SchedulePeriod,
    ScheduleSettings,
    WorkDay
};