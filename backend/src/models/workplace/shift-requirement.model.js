// backend/src/models/scheduling/shift-requirement.model.js
module.exports = (sequelize, DataTypes) => {
    const ShiftRequirement = sequelize.define('ShiftRequirement', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        position_shift_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'position_shifts',
                key: 'id'
            }
        },
        day_of_week: {
            type: DataTypes.TINYINT,
            allowNull: true,
            validate: {
                min: 0,
                max: 6
            },
            comment: '0=Sunday, 1=Monday, ..., 6=Saturday, NULL=all days'
        },
        required_staff_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 0
            }
        },
        is_recurring: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        specific_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        valid_from: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        valid_until: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        is_working_day: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'False = non-working day/shift'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'shift_requirements',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['position_shift_id', 'day_of_week', 'valid_from', 'valid_until'],
                where: {
                    is_recurring: true,
                    specific_date: null
                },
                name: 'unique_recurring_requirement'
            },
            {
                unique: true,
                fields: ['position_shift_id', 'specific_date'],
                where: {
                    is_recurring: false
                },
                name: 'unique_specific_requirement'
            }
        ]
    });

    // Class methods
    ShiftRequirement.getRequirementsForDate = async function(positionId, date) {
        const dayOfWeek = new Date(date).getDay();

        return await this.findAll({
            include: [{
                model: sequelize.models.PositionShift,
                as: 'shift',
                where: {
                    position_id: positionId,
                    is_active: true
                }
            }],
            where: {
                [sequelize.Op.and]: [
                    {
                        [sequelize.Op.or]: [
                            // Specific date requirements
                            {
                                is_recurring: false,
                                specific_date: date
                            },
                            // Recurring requirements for this day
                            {
                                is_recurring: true,
                                [sequelize.Op.or]: [
                                    { day_of_week: dayOfWeek },
                                    { day_of_week: null } // All days
                                ]
                            }
                        ]
                    },
                    // Check validity period
                    {
                        [sequelize.Op.or]: [
                            { valid_from: null },
                            { valid_from: { [sequelize.Op.lte]: date } }
                        ]
                    },
                    {
                        [sequelize.Op.or]: [
                            { valid_until: null },
                            { valid_until: { [sequelize.Op.gte]: date } }
                        ]
                    }
                ]
            },
            order: [
                ['is_recurring', 'ASC'], // Specific dates first
                ['shift', 'sort_order', 'ASC']
            ]
        });
    };

    return ShiftRequirement;
};