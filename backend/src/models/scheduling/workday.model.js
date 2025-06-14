// backend/src/models/scheduling/workday.model.js
module.exports = (sequelize, DataTypes) => {
    const Workday = sequelize.define('Workday', {
        workday_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
        is_workday: { type: DataTypes.BOOLEAN, defaultValue: true },
        holiday_name: { type: DataTypes.STRING(100) },
        special_instructions: { type: DataTypes.TEXT }
    }, {
        tableName: 'workdays',
        timestamps: true
    });
    return Workday;
};