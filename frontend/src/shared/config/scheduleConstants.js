export const ALGORITHM_TYPES = [
    { value: 'basic', label: 'Basic Algorithm' },
    { value: 'advanced', label: 'Advanced Algorithm' },
    { value: 'ai', label: 'AI-Powered Algorithm' }
];

export const DEFAULT_GENERATION_SETTINGS = {
    site_id: null,
    weekStart: '',
    algorithm: 'basic'
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