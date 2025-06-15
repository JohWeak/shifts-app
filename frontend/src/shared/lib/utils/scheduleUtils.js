import { format, addDays, parseISO } from 'date-fns';

export const getNextSunday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    const nextSunday = addDays(today, daysUntilSunday);
    return format(nextSunday, 'yyyy-MM-dd');
};

export const isValidWeekStartDate = (dateString) => {
    try {
        const date = parseISO(dateString);
        return date.getDay() === 0; // Sunday
    } catch {
        return false;
    }
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