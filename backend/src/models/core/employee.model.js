module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define('Employee', {
        emp_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        first_name: {type: DataTypes.STRING, allowNull: false},
        last_name: {type: DataTypes.STRING, allowNull: false},
        email: {type: DataTypes.STRING, allowNull: false, unique: true, validate: {isEmail: true}},
        login: {type: DataTypes.STRING, allowNull: false, unique: true},
        password: {type: DataTypes.STRING, allowNull: false},
        status: {type: DataTypes.ENUM('active', 'inactive', 'admin'), defaultValue: 'active'},
        role: {type: DataTypes.ENUM('employee', 'admin'), defaultValue: 'employee'},
        default_position_id: {type: DataTypes.INTEGER, allowNull: true, references: {model: 'positions', key: 'pos_id'}}
    }, {
        tableName: 'employees',
        timestamps: true,
        associate: function (models) {
            Employee.belongsTo(models.Position, {foreignKey: 'default_position_id', as: 'defaultPosition'});
            Employee.hasMany(models.EmployeeConstraint, {foreignKey: 'emp_id', as: 'constraints', onDelete: 'CASCADE'});
            Employee.hasMany(models.ScheduleAssignment, {
                foreignKey: 'emp_id',
                as: 'scheduleAssignments',
                onDelete: 'CASCADE'
            });
            Employee.hasMany(models.EmployeeQualification, {
                foreignKey: 'emp_id',
                as: 'qualifications',
                onDelete: 'CASCADE'
            });
        }
    });
    return Employee;
};