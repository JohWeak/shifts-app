// frontend/src/shared/lib/utils/constraintUtils.js
export const groupConstraintsByDay = (constraints, weekStartsOn = 0) => {
    const grouped = {};

    // Определяем порядок дней в зависимости от начала недели
    const baseDaysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daysOrder = weekStartsOn === 1
        ? [...baseDaysOrder.slice(1), baseDaysOrder[0]] // Начинаем с понедельника
        : baseDaysOrder; // Начинаем с воскресенья

    if (constraints && Array.isArray(constraints)) {
        constraints.forEach(constraint => {
            const dayLower = constraint.day_of_week.toLowerCase();
            if (!grouped[dayLower]) {
                grouped[dayLower] = [];
            }
            grouped[dayLower].push(constraint);
        });
    }

    // Сортируем по порядку дней
    const sortedGrouped = {};
    daysOrder.forEach(day => {
        if (grouped[day]) {
            sortedGrouped[day] = grouped[day];
        }
    });

    return sortedGrouped;
};

export const getDayIndex = (day, weekStartsOn = 0) => {
    const dayIndices = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
    };

    let index = dayIndices[day.toLowerCase()];

    // Корректируем индекс если неделя начинается с понедельника
    if (weekStartsOn === 1) {
        index = index === 0 ? 6 : index - 1;
    }

    return index;
};