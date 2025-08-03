// backend/src/services/employee-recommendation-scoring.js
/**
 * Scoring system explanation:
 *
 * Base score: 100 points
 *
 * POSITIVE FACTORS (increase availability):
 * - Primary position match: +50 points (best fit)
 * - Same work site: +30 points (no travel needed)
 * - Low weekly workload (<3 shifts): +20 points (fair distribution)
 * - Prefers this shift: +15 points (employee preference)
 * - No position (flexible): +10 points (can work anywhere)
 *
 * NEGATIVE FACTORS (decrease availability):
 * - Different work site: -40 points (travel required)
 * - Cross-position assignment: -30 points (not primary skill)
 * - High weekly workload (>5 shifts): -10 points per extra shift
 * - Prefers not to work: -20 points (soft constraint)
 *
 * BLOCKING FACTORS (score = 0):
 * - Already assigned today
 * - Permanent constraint
 * - Temporary cannot work
 * - Rest violation
 */

const SCORING_CONFIG = {
    // Base score for all employees
    BASE_SCORE: 100,

    // Position matching
    POSITION_MATCH: {
        PRIMARY: 50,        // Employee's primary position
        FLEXIBLE: 10,       // No position assigned (flexible)
        CROSS: -30         // Different position
    },

    // Work site matching
    SITE_MATCH: {
        SAME: 30,          // Same work site
        ANY: 0,            // Can work any site
        DIFFERENT: -40     // Different site (requires travel)
    },

    // Workload balance
    WORKLOAD: {
        LOW_THRESHOLD: 3,
        HIGH_THRESHOLD: 5,
        LOW_BONUS: 20,              // Under 3 shifts
        HIGH_PENALTY_PER_SHIFT: -10 // Per shift over 5
    },

    // Preferences
    PREFERENCES: {
        PREFERS_WORK: 15,      // Wants this shift
        PREFERS_NOT_WORK: -20  // Soft constraint
    }
};

class EmployeeScorer {
    static calculateScore(employee, targetPosition, targetShift, weeklyAssignments) {
        let score = SCORING_CONFIG.BASE_SCORE;
        const reasons = [];
        const penalties = [];

        // 1. Position matching
        if (!employee.default_position_id) {
            score += SCORING_CONFIG.POSITION_MATCH.FLEXIBLE;
            reasons.push({ type: 'flexible', points: SCORING_CONFIG.POSITION_MATCH.FLEXIBLE });
        } else if (employee.default_position_id === targetPosition.pos_id) {
            score += SCORING_CONFIG.POSITION_MATCH.PRIMARY;
            reasons.push({ type: 'primary_position', points: SCORING_CONFIG.POSITION_MATCH.PRIMARY });
        } else {
            score += SCORING_CONFIG.POSITION_MATCH.CROSS;
            penalties.push({ type: 'cross_position', points: SCORING_CONFIG.POSITION_MATCH.CROSS });
        }

        // 2. Work site matching
        if (!employee.work_site_id) {
            // Can work anywhere - neutral
            reasons.push({ type: 'any_site', points: 0 });
        } else if (employee.work_site_id === targetPosition.site_id) {
            score += SCORING_CONFIG.SITE_MATCH.SAME;
            reasons.push({ type: 'same_site', points: SCORING_CONFIG.SITE_MATCH.SAME });
        } else {
            score += SCORING_CONFIG.SITE_MATCH.DIFFERENT;
            penalties.push({ type: 'different_site', points: SCORING_CONFIG.SITE_MATCH.DIFFERENT });
        }

        // 3. Workload balance
        const shiftsThisWeek = weeklyAssignments.length;
        if (shiftsThisWeek < SCORING_CONFIG.WORKLOAD.LOW_THRESHOLD) {
            score += SCORING_CONFIG.WORKLOAD.LOW_BONUS;
            reasons.push({
                type: 'low_workload',
                points: SCORING_CONFIG.WORKLOAD.LOW_BONUS,
                shifts: shiftsThisWeek
            });
        } else if (shiftsThisWeek > SCORING_CONFIG.WORKLOAD.HIGH_THRESHOLD) {
            const penalty = (shiftsThisWeek - SCORING_CONFIG.WORKLOAD.HIGH_THRESHOLD) *
                SCORING_CONFIG.WORKLOAD.HIGH_PENALTY_PER_SHIFT;
            score += penalty;
            penalties.push({
                type: 'high_workload',
                points: penalty,
                shifts: shiftsThisWeek
            });
        }

        // Ensure score doesn't go below 0
        score = Math.max(0, score);

        return {
            score,
            reasons,
            penalties,
            breakdown: {
                base: SCORING_CONFIG.BASE_SCORE,
                position: (() => {
                    const posReason = reasons.find(r => r.type === 'primary_position' || r.type === 'flexible');
                    const posPenalty = penalties.find(p => p.type === 'cross_position');
                    return posReason?.points || posPenalty?.points || 0;
                })(),
                site: (() => {
                    const siteReason = reasons.find(r => r.type === 'same_site' || r.type === 'any_site');
                    const sitePenalty = penalties.find(p => p.type === 'different_site');
                    return siteReason?.points || sitePenalty?.points || 0;
                })(),
                workload: (() => {
                    const workReason = reasons.find(r => r.type === 'low_workload');
                    const workPenalty = penalties.find(p => p.type === 'high_workload');
                    return workReason?.points || workPenalty?.points || 0;
                })()
            }
        };
    }
}

module.exports = { EmployeeScorer, SCORING_CONFIG };