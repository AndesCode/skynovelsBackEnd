/*jshint esversion: 6 */
const novelsController = require('../controllers').novels;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');

module.exports = (app) => {
    app.get('/api/novel/:id/chapters', novelsController.getChapters);
    app.post('/api/new-chapter', md_auth.adminAuth, novelsController.createChapter);
    app.put('/api/update-chapter/:id', md_auth.adminAuth, novelsController.updateChapter);
    app.get('/api/chapter-edit/:id', md_auth.adminAuth, novelsController.getUserChapter);
    app.get('/api/chapters-by-date', novelsController.getAllChaptersByDate);
};