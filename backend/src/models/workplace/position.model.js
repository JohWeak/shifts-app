// backend/src/models/workplace/position.model.js
module.exports = (sequelize, DataTypes) => {
    const Position = sequelize.define('Position', {
        pos_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        pos_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        position_code: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Code for grouping similar positions across sites'
        },
        profession: {
            type: DataTypes.STRING(100)
        },
        num_of_emp: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        num_of_shifts: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        site_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'work_sites',
                key: 'site_id'
            }
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'positions',
        timestamps: true
    });

    return Position;
};