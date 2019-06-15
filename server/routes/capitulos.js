/*jshint esversion: 6 */
const novelasController = require('../controllers').novelas;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');

module.exports = (app) => {
    app.get('/api/novelas/:id/capitulos', novelasController.getCapitulos);
    app.post('/api/new-chapter', md_auth.adminAuth, novelasController.createChapter);
    app.put('/api/update-chapter/:id', md_auth.adminAuth, novelasController.updateChapter);
    app.get('/api/chapter-edit/:id', md_auth.adminAuth, novelasController.getUserChapter);
    app.get('/api/chapters-by-date', novelasController.getAllChaptersByDate);
};