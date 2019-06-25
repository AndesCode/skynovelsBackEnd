/*jshint esversion: 6 */
const userController = require('../controllers').users;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/users' });

module.exports = (app) => {
    app.post('/api/create-user', userController.create);
    app.post('/api/login', userController.login);
    app.get('/api/users', md_auth.auth, userController.getAll);
    app.get('/api/user/email-verification/:key', userController.activateUser);
    app.post('/api/user/password-reset', userController.passwordResetRequest);
    app.get('/api/user/:id', md_auth.auth, userController.getUser);
    app.put('/api/update-user-password', md_auth.emailVerificationAuth, userController.updateUserPassword);
    app.put('/api/update-user/:id', md_auth.auth, userController.update);
    app.get('/api/user/get-user-by-email-token/:token', md_auth.emailVerificationAuth, userController.getUserByEmailToken);
    app.post('/api/upload-profile-img/:id', [md_auth.auth, md_upload], userController.uploadUserProfileImg);
    app.get('/api/user/image/:profile_img/:thumb', userController.getUserProfileImage);
};