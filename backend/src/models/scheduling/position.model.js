// backend/src/models/scheduling/position.model.js
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
        required_roles: {
            type: DataTypes.JSON,
            defaultValue: [],
            get() {
                const value = this.getDataValue('required_roles');
                return value || [];
            }
        }
    }, {
        tableName: 'positions',
        timestamps: true
    });

    return Position;
};