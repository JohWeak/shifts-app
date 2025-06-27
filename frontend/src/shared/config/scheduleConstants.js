export const ALGORITHM_TYPES = [
    { value: 'auto', label: 'Auto' },
    { value: 'cp-sat', label: 'CP-SAT by Google OR-Tools' },
    { value: 'simple', label: 'Simple' }
];

export const DEFAULT_GENERATION_SETTINGS = {
    site_id: null,
    weekStart: '',
    algorithm: 'auto'
};

export const SCHEDULE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};

export const SHIFT_TYPES = {
    MORNING: 'morning',
    DAY: 'day',
    NIGHT: 'night'
};