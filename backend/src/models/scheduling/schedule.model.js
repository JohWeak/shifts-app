module.exports = (sequelize, DataTypes) => {
    const Schedule = sequelize.define('Schedule', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        start_date: { type: DataTypes.DATE, allowNull: false },
        end_date: { type: DataTypes.DATE, allowNull: false },
        text_file: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('draft', 'published', 'archived'), defaultValue: 'draft' },
        site_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'work_sites', key: 'site_id' } }
    }, {
        tableName: 'schedules',
        timestamps: true,
        associate: function(models) {
            Schedule.belongsTo(models.WorkSite, { foreignKey: 'site_id', as: 'workSite' });
            Schedule.hasMany(models.ScheduleAssignment, { foreignKey: 'schedule_id', as: 'assignments', onDelete: 'CASCADE' });
        }
    });
    return Schedule;
};