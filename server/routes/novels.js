/*jshint esversion: 6 */
const novelsController = require('../controllers').novels;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/novels' });

module.exports = (app) => {
    // Novels
    app.get('/api/novel/:name/:action', novelsController.getNovel);
    app.get('/api/novels', novelsController.getNovels);
    app.get('/api/novel/image/:novel_img/:thumb', md_auth.auth, novelsController.getNovelImage);
    app.put('/api/update-novel', md_auth.auth, novelsController.updateNovel);
    app.post('/api/create-novel', md_auth.auth, novelsController.createNovel);
    app.post('/api/upload-novel-img/:id', [md_auth.auth, md_upload], novelsController.uploadNovelImage);
    app.delete('/api/delete-novel/:id', md_auth.auth, novelsController.deleteNovel);
    // chapters
    app.get('/api/chapter/:id', novelsController.getChapter);
    app.get('/api/chapters', novelsController.getChapters);
    app.put('/api/update-chapter', md_auth.auth, novelsController.updateChapter);
    app.post('/api/create-chapter', md_auth.auth, novelsController.createChapter);
    app.delete('/api/delete-chapter/:id', md_auth.auth, novelsController.deleteChapter);
    // Genres
    app.get('/api/genres', novelsController.getGenres);
    // Novels ratings
    app.post('/api/create-novel-rating', md_auth.auth, novelsController.createNovelRating);
    app.put('/api/update-novel-rating', md_auth.auth, novelsController.updateNovelRating);
    app.delete('/api/delete-novel-rating/:id', md_auth.auth, novelsController.deleteNovelRating);
};