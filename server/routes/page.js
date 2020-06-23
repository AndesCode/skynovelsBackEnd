/*jshint esversion: 6 */
const pageController = require('../controllers').page;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    // Likes
    app.post('/api/create-like', md_auth.auth, pageController.createLike);
    app.delete('/api/delete-like/:id', md_auth.auth, pageController.deleteLike);
    // Advertisements
    app.get('/api/get-advertisements', pageController.getAdvertisements);
    app.get('/api/get-advertisement/:id', pageController.getAdvertisement);
    app.get('/api/advertisement/image/:advertisement_img', pageController.getAdvertisementImage);
    // Comments
    app.post('/api/create-comment', md_auth.auth, pageController.createComment);
    app.get('/api/get-comments/:id/:objt', pageController.getComments);
    app.put('/api/update-comment', md_auth.auth, pageController.updateComment);
    app.delete('/api/delete-comment/:id', md_auth.auth, pageController.deleteComment);
    // Replys
    app.post('/api/create-reply', md_auth.auth, pageController.createReply);
    app.get('/api/get-replys/:id/:objt', pageController.getReplys);
    app.put('/api/update-reply', md_auth.auth, pageController.updateReplys);
    app.delete('/api/delete-reply/:id', md_auth.auth, pageController.deleteReplys);
};