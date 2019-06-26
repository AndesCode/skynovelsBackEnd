/*jshint esversion: 6 */
const novelsController = require('../controllers').novels;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/novels' });

module.exports = (app) => {
    app.post('/api/new-novel', md_auth.adminAuth, novelsController.create);
    app.put('/api/update-novel/:id', md_auth.adminAuth, novelsController.update);
    app.post('/api/upload-novel-img/:id', [md_auth.adminAuth, md_upload], novelsController.uploadNovelImage);
    app.get('/api/novel/:id', novelsController.getNovel);
    app.get('/api/novels', novelsController.getAll);
    app.get('/api/novels-admin', md_auth.adminAuth, novelsController.getAllAdmin);
    app.post('/api/novels-user', md_auth.adminAuth, novelsController.getUserNovels);
    app.get('/api/novel/image/:novel_img/:thumb', novelsController.getNovelImage);
    app.delete('/api/delete-novel/:id', md_auth.adminAuth, novelsController.deleteNovel);
    app.get('/api/home-last-novels', novelsController.getAllByDate);
    app.get('/api/novel-genres/:id', novelsController.getNovelGenres);
    app.get('/api/search-novels/:term', novelsController.searchNovels);
};