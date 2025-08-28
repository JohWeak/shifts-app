// backend/src/services/i18n.service.js
const i18next = require('i18next');
const en = require('../locales/en.json');
const ru = require('../locales/ru.json');
const he = require('../locales/he.json');

i18next.init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
        en: { translation: en },
        ru: { translation: ru },
        he: { translation: he },
    },
    interpolation: {
        escapeValue: false,
    },
});

module.exports = i18next;