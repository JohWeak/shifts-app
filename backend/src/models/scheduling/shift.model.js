module.exports = (sequelize, DataTypes) => {
    const Shift = sequelize.define('Shift', {
        shift_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        shift_name: { type: DataTypes.STRING, allowNull: false },
        shift_type: { type: DataTypes.ENUM('morning', 'day', 'evening', 'night'), allowNull: false },
        start_time: { type: DataTypes.TIME, allowNull: false },
        end_time: { type: DataTypes.TIME, allowNull: false, comment: 'Calculated end time' },
        duration: { type: DataTypes.INTEGER, allowNull: false, comment: 'Duration in hours' },
        is_night_shift: { type: DataTypes.BOOLEAN, defaultValue: false },
        min_employees: { type: DataTypes.INTEGER, defaultValue: 1 }
    }, {
        tableName: 'shifts',
        timestamps: true,

    });
    return Shift;
};