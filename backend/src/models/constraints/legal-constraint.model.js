module.exports = (sequelize, DataTypes) => {
    const LegalConstraint = sequelize.define('LegalConstraint', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        rule_name: { type: DataTypes.STRING, allowNull: false, comment: 'Name of the legal rule' },
        rule_type: { type: DataTypes.ENUM('max_daily_hours', 'min_rest_between_shifts', 'weekly_rest', 'mandatory_day_off', 'max_night_shifts', 'max_overtime_weekly', 'max_consecutive_days'), allowNull: false },
        constraint_value: { type: DataTypes.INTEGER, allowNull: false, comment: 'Numeric value for the constraint (hours, days, etc.)' },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        description: { type: DataTypes.TEXT, comment: 'Description of the legal requirement' }
    }, {
        tableName: 'legal_constraints',
        timestamps: true,
        // no associations for now
    });
    return LegalConstraint;
};