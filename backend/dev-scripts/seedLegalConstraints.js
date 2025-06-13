// backend/src/scripts/seedLegalConstraints.js
const { LegalConstraint } = require('../models/associations');
const sequelize = require('../config/db.config');
require('dotenv').config();

async function seedLegalConstraints() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Israeli labor law constraints (updated)
        const legalConstraints = [
            {
                rule_name: 'Maximum Daily Hours',
                rule_type: 'max_daily_hours',
                constraint_value: 12,
                description: 'Maximum 12 hours per day including overtime (Israeli law)'
            },
            {
                rule_name: 'Minimum Legal Rest Between Shifts',
                rule_type: 'min_rest_between_shifts',
                constraint_value: 8,
                description: 'Legal minimum 8 hours rest between working days (Israeli law)'
            },
            {
                rule_name: 'Weekly Rest Period',
                rule_type: 'weekly_rest',
                constraint_value: 36,
                description: 'Minimum 36 consecutive hours of weekly rest (Israeli law)'
            },
            {
                rule_name: 'Maximum Weekly Overtime',
                rule_type: 'max_overtime_weekly',
                constraint_value: 15,
                description: 'Maximum 15 overtime hours per week (Israeli law)'
            },
            {
                rule_name: 'Max Consecutive Days (Recommended)',
                rule_type: 'max_consecutive_days',
                constraint_value: 6,
                description: 'Recommended maximum 6 consecutive working days'
            }
        ];

        for (const constraint of legalConstraints) {
            await LegalConstraint.findOrCreate({
                where: { rule_name: constraint.rule_name },
                defaults: constraint
            });
        }

        console.log('Legal constraints seeded successfully!');
    } catch (error) {
        console.error('Error seeding legal constraints:', error);
    } finally {
        await sequelize.close();
    }
}

seedLegalConstraints();