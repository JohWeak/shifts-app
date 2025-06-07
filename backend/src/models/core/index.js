// backend/src/models/core/index.js
const Employee = require('./employee.model');
const WorkSite = require('./worksite.model');
const EmployeeQualification = require('./employee-qualification.model');

module.exports = {
    Employee,
    WorkSite,
    EmployeeQualification
};