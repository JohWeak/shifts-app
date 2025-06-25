// backend/src/models/scheduling/worksite.model.js
module.exports = (sequelize, DataTypes) => {
    const WorkSite = sequelize.define('WorkSite', {
        site_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        site_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING(50),
            allowNull: true,
            validate: {
                is: /^[\d\s\-\+\(\)]+$/ // Basic phone validation
            }
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        timezone: {
            type: DataTypes.STRING(50),
            defaultValue: 'Asia/Jerusalem'
        }
    }, {
        tableName: 'work_sites',
        timestamps: true
    });



    return WorkSite;
};