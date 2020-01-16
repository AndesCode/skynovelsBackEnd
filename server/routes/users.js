/*jshint esversion: 6 */
const userController = require('../controllers').users;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/users' });

module.exports = (app) => {
    // LogIn - LogOut
    app.post('/api/login', userController.login);
    app.get('/api/logout', userController.logout);
    // User register
    app.post('/api/create-user', userController.createUser);
    app.post('/api/activate-user/:key', userController.activateUser);
    // Users
    app.get('/api/user/:id', userController.getUser);
    app.get('/api/users/:status', md_auth.adminAuth, userController.getUsers);
    app.put('/api/update-user', md_auth.auth, userController.updateUser);
    app.delete('/api/delete-user/:id', md_auth.adminAuth, userController.deleteUser);
    // Passwords
    app.post('/api/password-reset-request', userController.passwordResetRequest);
    app.post('/api/password-reset', md_auth.changePasswordTokenAuth, userController.updateUserPassword);
    // Imgs
    app.post('/api/upload-user-profile-img/:id', [md_auth.auth, md_upload], userController.uploadUserProfileImg);
    app.get('/api/user-profile-img/:profile_img/:thumb', userController.getUserProfileImage);
    // Bookmarks
    app.post('/api/create-user-bookmark', md_auth.auth, userController.createUserbookmark);
    app.put('/api/update-user-bookmark', md_auth.auth, userController.updateUserbookmark);
    app.delete('/api/delete-user-bookmark/:id', md_auth.auth, userController.removeUserbookmark);
    // Invitations
    app.post('/api/create-user-invitation', md_auth.auth, userController.createUserInvitation);
    app.put('/api/update-user-invitation', md_auth.auth, userController.updateUserInvitation);
};