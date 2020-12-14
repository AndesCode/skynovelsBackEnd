/*jshint esversion: 6 */
const novelsController = require('../controllers').novels;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/novels' });

module.exports = (app) => {
    // Home
    app.get('/api/home', novelsController.getHomeNovels);
    app.get('/api/home-updated-novel-chapters/:id', novelsController.getUpdatedNovelsChapters);
    // Novels
    app.get('/api/novel/:id/:action', novelsController.getNovel);
    app.get('/api/novels', novelsController.getNovels);
    app.get('/api/novel/image/:novel_img/:thumb', novelsController.getNovelImage);
    app.put('/api/update-novel', md_auth.EditorAuth, novelsController.updateNovel);
    app.post('/api/create-novel', md_auth.EditorAuth, novelsController.createNovel);
    app.post('/api/upload-novel-img/:id', [md_auth.EditorAuth, md_upload], novelsController.uploadNovelImage);
    app.delete('/api/delete-novel/:id', md_auth.EditorAuth, novelsController.deleteNovel);
    // Volumes
    app.post('/api/create-novel-volume', md_auth.EditorAuth, novelsController.createNovelVolume);
    app.put('/api/update-novel-volume', md_auth.EditorAuth, novelsController.updateNovelVolume);
    app.delete('/api/delete-novel-volume/:id', md_auth.EditorAuth, novelsController.deleteNovelVolume);
    // chapters
    app.get('/api/novel-chapter/:id', novelsController.getChapter);
    app.get('/api/novel-chapter-edition/:id', md_auth.EditorAuth, novelsController.getChapterEdition);
    app.get('/api/novel-chapters/:id', novelsController.getNovelChapters);
    app.put('/api/update-chapter', md_auth.EditorAuth, novelsController.updateChapter);
    app.post('/api/create-chapter', md_auth.EditorAuth, novelsController.createChapter);
    app.delete('/api/delete-chapter/:id', md_auth.EditorAuth, novelsController.deleteChapter);
    // Genres
    app.get('/api/genres', novelsController.getGenres);
    // Novels ratings
    app.post('/api/create-novel-rating', md_auth.auth, novelsController.createNovelRating);
    app.put('/api/update-novel-rating', md_auth.auth, novelsController.updateNovelRating);
    app.delete('/api/delete-novel-rating/:id', md_auth.auth, novelsController.deleteNovelRating);
    // test
    app.get('/api/test', novelsController.getTest);
};