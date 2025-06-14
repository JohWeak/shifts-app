// backend/src/models/core/worksite.model.js
module.exports = (sequelize, DataTypes) => {
    const WorkSite = sequelize.define('WorkSite', {
        site_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        site_name: { type: DataTypes.STRING(255), allowNull: false }
    }, {
        tableName: 'work_sites',
        timestamps: true
    });
    return WorkSite;
};