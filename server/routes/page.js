/*jshint esversion: 6 */
const pageController = require('../controllers').page;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
     // Reactions
     app.post('/api/create-reaction', md_auth.auth, pageController.createReaction);
     app.delete('/api/delete-reaction/:id', md_auth.auth, pageController.deleteReaction);
    // Likes
    app.post('/api/create-like', md_auth.auth, pageController.createLike);
    app.delete('/api/delete-like/:id', md_auth.auth, pageController.deleteLike);
    // Advertisements
    app.get('/api/get-advertisements', pageController.getAdvertisements);
    app.get('/api/get-advertisement/:id', pageController.getAdvertisement);
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
    // images
    app.get('/api/get-image/:file_name/:image_type/:thumb', pageController.getImage);
    // Test
    //app.get('/api/get-notTest', pageController.getNotificationsTest);
};