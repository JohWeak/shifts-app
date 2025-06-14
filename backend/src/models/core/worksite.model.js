module.exports = (sequelize, DataTypes) => {
    const WorkSite = sequelize.define('WorkSite', {
        site_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        site_name: { type: DataTypes.STRING, allowNull: false }
    }, {
        tableName: 'work_sites',
        timestamps: true,

    });
    return WorkSite;
};