import { format, addDays, startOfWeek, parseISO } from 'date-fns';

export const getWeekStartDay = (systemSettings) => {
    // Из настроек системы, а не из локали
    return systemSettings?.weekStartDay ?? 0; // По умолчанию воскресенье
};

export const isValidWeekStartDate = (dateString, weekStartDay = 0) => {
    try {
        const date = parseISO(dateString);
        return date.getDay() === weekStartDay;
    } catch {
        return false;
    }
};

export const getNextWeekStart = (weekStartDay = 0) => {
    const today = new Date();
    const currentDay = today.getDay();

    let daysUntilStart;
    if (currentDay === weekStartDay) {
        daysUntilStart = 7; // Следующая неделя
    } else if (currentDay < weekStartDay) {
        daysUntilStart = weekStartDay - currentDay;
    } else {
        daysUntilStart = 7 - currentDay + weekStartDay;
    }

    const nextStart = addDays(today, daysUntilStart);
    return format(nextStart, 'yyyy-MM-dd');
};

export const getWeekDates = (startDate, weekStartDay = 0) => {
    const start = parseISO(startDate);
    const dates = [];

    // Убедимся, что начинаем с правильного дня недели
    let currentDate = start;
    if (currentDate.getDay() !== weekStartDay) {
        // Найти ближайший день начала недели
        const diff = (weekStartDay - currentDate.getDay() + 7) % 7;
        currentDate = addDays(currentDate, diff);
    }

    // Генерируем 7 дней
    for (let i = 0; i < 7; i++) {
        dates.push(addDays(currentDate, i));
    }

    return dates;
};

export const formatScheduleDate = (startDate, endDate = null) => {
    if (!startDate) return '-';

    try {
        const start = parseISO(startDate);
        if (endDate) {
            const end = parseISO(endDate);
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        }
        return format(start, 'MMM d, yyyy');
    } catch {
        return startDate;
    }
};

export const getStatusBadgeVariant = (status) => {
    const variants = {
        published: 'success',
        draft: 'warning',
        archived: 'secondary'
    };
    return variants[status] || 'secondary';
};

export const canDeleteSchedule = (schedule) => {
    return schedule.status !== 'published';
};

export const getSiteName = (siteId, sites = []) => {
    const site = sites.find(s => s.site_id === siteId);
    return site?.site_name || `Site ${siteId}`;
};