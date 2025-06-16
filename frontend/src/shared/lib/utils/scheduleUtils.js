import { format, addDays, parseISO } from 'date-fns';

export const getWeekStartDay = (locale) => {
    // Для иврита - воскресенье (0), для остальных - понедельник (1)
    return locale === 'he' ? 0 : 1;
};

export const isValidWeekStartDate = (dateString, locale = 'en') => {
    try {
        const date = parseISO(dateString);
        const expectedStartDay = getWeekStartDay(locale);
        return date.getDay() === expectedStartDay;
    } catch {
        return false;
    }
};

export const getNextWeekStart = (locale = 'en') => {
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = getWeekStartDay(locale);

    let daysUntilStart;
    if (currentDay === targetDay) {
        daysUntilStart = 7; // Следующая неделя
    } else if (currentDay < targetDay) {
        daysUntilStart = targetDay - currentDay;
    } else {
        daysUntilStart = 7 - currentDay + targetDay;
    }

    const nextStart = addDays(today, daysUntilStart);
    return format(nextStart, 'yyyy-MM-dd');
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