// backend/src/models/workplace/worksite.model.js
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
                // Убираем is валидатор или делаем его опциональным
                isValidPhone(value) {
                    if (!value || value === '') return true; // Пустое значение разрешено
                    // Базовая проверка формата телефона
                    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                    if (!phoneRegex.test(value)) {
                        throw new Error('Invalid phone format');
                    }
                }
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