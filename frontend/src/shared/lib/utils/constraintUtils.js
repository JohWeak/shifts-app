// frontend/src/shared/lib/utils/constraintUtils.js
/**
 * Groups a list of constraints by the day of the week and orders them based on the week start day.
 *
 * @param {Object[]} constraints - An array of constraint objects, where each object contains a `day_of_week` property.
 * @param {number} [weekStartsOn=0] - Indicates the starting day of the week. `0` represents Sunday and `1` represents Monday.
 * @returns {Object} An object where each key is a lowercase day of the week (e.g., 'monday') and the value is an array of constraints corresponding to that day, ordered by the specified week start day.
 */
export const groupConstraintsByDay = (constraints, weekStartsOn = 0) => {
    const grouped = {};

    // Determine the order of days depending on the start of the week
    const baseDaysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daysOrder = weekStartsOn === 1
        ? [...baseDaysOrder.slice(1), baseDaysOrder[0]] // Start with Monday
        : baseDaysOrder; // Start with Sunday

    if (constraints && Array.isArray(constraints)) {
        constraints.forEach(constraint => {
            const dayLower = constraint.day_of_week.toLowerCase();
            if (!grouped[dayLower]) {
                grouped[dayLower] = [];
            }
            grouped[dayLower].push(constraint);
        });
    }

    // Sort by the order of days
    const sortedGrouped = {};
    daysOrder.forEach(day => {
        if (grouped[day]) {
            sortedGrouped[day] = grouped[day];
        }
    });

    return sortedGrouped;
};

/**
 * Calculates the index of a given day in the week based on the specified starting day of the week.
 *
 * @param {string} day - The name of the day (e.g., 'Monday', 'Tuesday').
 *                       The input is case-insensitive.
 * @param {number} [weekStartsOn=0] - Specifies which day the week starts on.
 *                                    Use 0 for Sunday and 1 for Monday. Defaults to 0.
 * @returns {number} The index of the day in the week, adjusted based on the starting day of the week.
 *                   Sunday is represented as 0 when weekStartsOn is 0, or as 6 if weekStartsOn is 1.
 *                   For Monday as the start of the week (weekStartsOn = 1), the index adjusts accordingly.
 * @throws {TypeError} If the provided day is not a valid string.
 * @throws {Error} If the provided day is not a recognized day of the week.
 */
export const getDayIndex = (day, weekStartsOn = 0) => {
    const dayIndices = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
    };

    let index = dayIndices[day.toLowerCase()];

    // Adjust the index if the week starts on Monday
    if (weekStartsOn === 1) {
        index = index === 0 ? 6 : index - 1;
    }

    return index;
};