/*jshint esversion: 6 */
const novelasController = require('../controllers').novelas;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/novelas' });

module.exports = (app) => {
    app.post('/api/nueva-novela', md_auth.adminAuth, novelasController.create);
    app.put('/api/update-novela/:id', md_auth.adminAuth, novelasController.update);
    app.post('/api/upload-novela-img/:id', [md_auth.adminAuth, md_upload], novelasController.uploadnovelaimg);
    app.get('/api/novela/:id', novelasController.getnovela);
    app.get('/api/novelas', novelasController.getAll);
    app.get('/api/novelas-admin', md_auth.adminAuth, novelasController.getAllAdmin);
    app.post('/api/novelas-usuario', md_auth.adminAuth, novelasController.getUserNovels);
    app.get('/api/novela/image/:novel_img/:thumb', novelasController.getNovelImage);
    app.delete('/api/delete-novela/:id', md_auth.adminAuth, novelasController.deleteNovel);
    app.get('/api/home-last-novels', novelasController.getAllByDate);
    app.get('/api/novel-genres/:id', novelasController.getNovelGenres);
    app.get('/api/search-novels/:term', novelasController.searchNovels);
};