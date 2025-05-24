// backend/src/models/index.js
const core = require('./core');
const scheduling = require('./scheduling');
const constraints = require('./constraints');

// Export all models grouped by domain
module.exports = {
    ...core,
    ...scheduling,
    ...constraints
};