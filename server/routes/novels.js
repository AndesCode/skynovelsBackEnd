/*jshint esversion: 6 */
const novelsController = require('../controllers').novels;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/novels' });

module.exports = (app) => {
    app.post('/api/new-novel', md_auth.adminAuth, novelsController.create);
    app.put('/api/update-novel', md_auth.adminAuth, novelsController.update);
    app.post('/api/upload-novel-img/:id', [md_auth.adminAuth, md_upload], novelsController.uploadNovelImage);
    app.get('/api/novel/:id', novelsController.getNovel);
    app.get('/api/novels', novelsController.getActiveNovels);
    app.get('/api/all-novels', novelsController.getAllNovels);
    app.post('/api/novels-user', md_auth.adminAuth, novelsController.getUserNovels);
    app.post('/api/novels-collaborators', md_auth.adminAuth, novelsController.getUserCollaborationsNovels);
    app.get('/api/get-novel-collaborators/:id', md_auth.adminAuth, novelsController.getCollaboratorsFromNovel);
    app.get('/api/novel/image/:novel_img/:thumb', novelsController.getNovelImage);
    app.delete('/api/delete-novel/:id', md_auth.adminAuth, novelsController.deleteNovel);
    app.get('/api/home-last-novels', novelsController.getAllByDate);
    app.get('/api/novel-genres/:id', novelsController.getNovelGenres);
    app.get('/api/search-novels/:term', novelsController.searchNovels);
    app.get('/api/genres', novelsController.getGenres);
    app.post('/api/add-genre-to-novel', md_auth.adminAuth, novelsController.addGenreToNovel);
    app.delete('/api/clean-novel-genres/:id', md_auth.adminAuth, novelsController.deleteNovelGenres);
    app.post('/api/new-genre', md_auth.adminAuth, novelsController.createGenre);
    app.put('/api/update-genre', md_auth.adminAuth, novelsController.updateGenre);
    app.delete('/api/delete-genre/:id', md_auth.adminAuth, novelsController.deleteGenre);
};