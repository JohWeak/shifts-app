// backend/src/models/constraints/legal-constraint.model.js
module.exports = (sequelize, DataTypes) => {
    const LegalConstraint = sequelize.define('LegalConstraint', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        rule_name: { type: DataTypes.STRING(255), allowNull: false },
        rule_type: {
            type: DataTypes.ENUM('max_daily_hours', 'min_rest_between_shifts', 'weekly_rest',
                'mandatory_day_off', 'max_night_shifts', 'max_overtime_weekly', 'max_consecutive_days'),
            allowNull: false
        },
        constraint_value: { type: DataTypes.INTEGER, allowNull: false },
        description: { type: DataTypes.TEXT }
    }, {
        tableName: 'legal_constraints',
        timestamps: true
    });
    return LegalConstraint;
};