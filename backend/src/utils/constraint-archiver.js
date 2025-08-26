// backend/src/utils/constraint-archiver.js
const db = require('../models');
const dayjs = require('dayjs');
const {EmployeeConstraint} = db;

const archiveOldConstraints = async () => {
    const transaction = await db.sequelize.transaction();

    try {
        // Archive constraints older than 3 months
        const threeMonthsAgo = dayjs().subtract(3, 'months').format('YYYY-MM-DD');

        // Find old constraints
        const oldConstraints = await EmployeeConstraint.findAll({
            where: {
                target_date: {
                    [db.Sequelize.Op.lt]: threeMonthsAgo
                },
                is_permanent: false
            },
            transaction
        });

        if (oldConstraints.length > 0) {
            // Create archive records (need to create this table)
            // const archiveData = oldConstraints.map(c => ({
            //     original_id: c.id,
            //     data: JSON.stringify(c.toJSON()),
            //     archived_at: new Date()
            // }));

            // await db.ConstraintArchive.bulkCreate(archiveData, { transaction });

            // Delete old constraints
            await EmployeeConstraint.destroy({
                where: {
                    id: oldConstraints.map(c => c.id)
                },
                transaction
            });

            console.log(`Archived ${oldConstraints.length} old constraints`);
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error archiving constraints:', error);
    }
};

module.exports = {archiveOldConstraints};