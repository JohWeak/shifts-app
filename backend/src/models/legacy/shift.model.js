// backend/src/models/scheduling/shift.model.js
module.exports = (sequelize, DataTypes) => {
    const Shift = sequelize.define('Shift', {
        shift_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        shift_name: { type: DataTypes.STRING(100), allowNull: false },
        duration: { type: DataTypes.INTEGER, allowNull: false },
        start_time: { type: DataTypes.TIME, allowNull: false },
        shift_type: {
            type: DataTypes.ENUM('morning', 'day', 'evening', 'night'),
            allowNull: false
        },
        is_night_shift: { type: DataTypes.BOOLEAN, defaultValue: false },
        end_time: { type: DataTypes.TIME, allowNull: false, defaultValue: '14:00:00' },
        min_employees: { type: DataTypes.INTEGER, defaultValue: 1 }
    }, {
        tableName: 'shifts',
        timestamps: true
    });
    return Shift;
};