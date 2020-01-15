/*jshint esversion: 6 */
const novelsController = require('../controllers').novels;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/novels' });

module.exports = (app) => {
    // Novels
    app.get('/api/novel/:id/:action', novelsController.getNovel);
    app.get('/api/novels/:status', novelsController.getNovels);
    app.get('/api/novel/image/:novel_img/:thumb', md_auth.auth, novelsController.getNovelImage); // loged user require
    app.put('/api/update-novel', md_auth.auth, novelsController.updateNovel); // loged user require
    app.post('/api/create-novel', md_auth.auth, novelsController.createNovel); // loged user require
    app.post('/api/upload-novel-img/:id', [md_upload], novelsController.uploadNovelImage); // loged user require
    app.delete('/api/delete-novel/:id', md_auth.auth, novelsController.deleteNovel); // loged user require
    // chapters
    app.get('/api/chapter/:id', novelsController.getChapter);
    app.get('/api/chapters', novelsController.getChapters);
    app.put('/api/update-chapter', novelsController.updateChapter); // loged user require
    app.post('/api/create-chapter', novelsController.createChapter); // loged user require
    app.delete('/api/delete-chapter/:id', novelsController.deleteChapter); // loged user require
    // Genres
    app.get('/api/genres', novelsController.getGenres);
    app.post('/api/create-genre', novelsController.createGenre); // loged user require
    app.put('/api/update-genre', novelsController.updateGenre); // loged user require
    app.delete('/api/delete-genre/:id', novelsController.deleteGenre); // loged user require
    // Novels ratings
    app.post('/api/create-novel-rating', novelsController.createNovelRating); // loged user require
    app.put('/api/update-novel-rating', novelsController.updateNovelRating); // loged user require
    app.delete('/api/delete-novel-rating/:id', novelsController.deleteNovelRating); // loged user require
};