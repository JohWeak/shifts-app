// backend/src/models/scheduling/shift.model.js (исправленная версия)
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.config');

const Shift = sequelize.define('Shift', {
    shift_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shift_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shift_type: {
        type: DataTypes.ENUM('morning', 'day', 'evening', 'night'),
        allowNull: false
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false,
        comment: 'Calculated end time'
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Duration in hours'
    },
    is_night_shift: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True if shift includes night hours (22:00-06:00)'
    },
    min_employees: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Minimum employees required for this shift'
    }
    // ВАЖНО: emp_id полностью удален!
}, {
    tableName: 'shifts',
    timestamps: true,
    // Убираем хуки пока что, они могут вызывать проблемы
    hooks: {
        beforeSave: (shift) => {
            if (shift.start_time && shift.duration) {
                const [hours, minutes] = shift.start_time.split(':');
                const startHour = parseInt(hours);
                const endHour = (startHour + shift.duration) % 24;
                shift.end_time = `${endHour.toString().padStart(2, '0')}:${minutes}`;
            }
        }
    }
});

module.exports = Shift;