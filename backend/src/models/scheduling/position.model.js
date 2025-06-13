module.exports = (sequelize, DataTypes) => {
    const Position = sequelize.define('Position', {
        pos_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        pos_name: { type: DataTypes.STRING, allowNull: false },
        profession: { type: DataTypes.STRING, allowNull: false },
        num_of_emp: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        num_of_shifts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        site_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'work_sites', key: 'site_id' } }
    }, {
        tableName: 'positions',
        timestamps: true,
        associate: function(models) {
            Position.belongsTo(models.WorkSite, { foreignKey: 'site_id', as: 'workSite' });
            Position.hasMany(models.Employee, { foreignKey: 'default_position_id', as: 'defaultEmployees' });
            Position.hasMany(models.ScheduleAssignment, { foreignKey: 'position_id', as: 'scheduleAssignments', onDelete: 'CASCADE' });
        }
    });
    return Position;
};