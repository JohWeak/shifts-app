const Employee = require('./employee.model');
const WorkSite = require('./worksite.model');
const Position = require('./position.model');
const Shift = require('./shift.model');
const Constraint = require('./constraint.model');
const Schedule = require('./schedule.model');
const WorkDay = require('./workday.model');

// Defining relationships between models
WorkSite.hasMany(Position, { foreignKey: 'site_id' });
Position.belongsTo(WorkSite, { foreignKey: 'site_id' });

Position.hasMany(WorkDay, { foreignKey: 'pos_id' });
WorkDay.belongsTo(Position, { foreignKey: 'pos_id' });

Employee.hasMany(Constraint, { foreignKey: 'emp_id' });
Constraint.belongsTo(Employee, { foreignKey: 'emp_id' });

Shift.hasMany(Constraint, { foreignKey: 'shift_id' });
Constraint.belongsTo(Shift, { foreignKey: 'shift_id' });

Employee.hasMany(Shift, { foreignKey: 'emp_id' });
Shift.belongsTo(Employee, { foreignKey: 'emp_id' });

// Model export
module.exports = {
    Employee,
    WorkSite,
    Position,
    Shift,
    Constraint,
    Schedule,
    WorkDay
};