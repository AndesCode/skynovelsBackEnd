/*jshint esversion: 6 */
const novelsController = require('../controllers').novels;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    app.get('/api/novel/:id/chapters', novelsController.getChapters);
    app.post('/api/new-chapter', md_auth.auth, novelsController.createChapter);
    app.put('/api/update-chapter/:id', md_auth.auth, novelsController.updateChapter);
    app.delete('/api/delete-chapter/:id', md_auth.auth, novelsController.deleteChapter);
    app.get('/api/chapter-edit/:id', md_auth.auth, novelsController.getUserChapter);
    app.get('/api/chapters-by-date', novelsController.getAllChaptersByDate);
};