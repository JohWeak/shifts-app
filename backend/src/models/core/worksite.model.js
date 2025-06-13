module.exports = (sequelize, DataTypes) => {
    const WorkSite = sequelize.define('WorkSite', {
        site_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        site_name: { type: DataTypes.STRING, allowNull: false }
    }, {
        tableName: 'work_sites',
        timestamps: true,
        associate: function(models) {
            WorkSite.hasMany(models.Position, { foreignKey: 'site_id', as: 'positions', onDelete: 'CASCADE' });
            WorkSite.hasMany(models.Schedule, { foreignKey: 'site_id', as: 'schedules', onDelete: 'CASCADE' });
            WorkSite.hasOne(models.ScheduleSettings, { foreignKey: 'site_id', as: 'scheduleSettings' });
        }
    });
    return WorkSite;
};