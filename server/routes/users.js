/*jshint esversion: 6 */
const userController = require('../controllers').users;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/users' });

module.exports = (app) => {
    // LogIn - LogOut
    app.post('/api/login', userController.login);
    app.get('/api/logout', md_auth.auth, userController.logout);
    // User register
    app.post('/api/create-user', userController.createUser);
    app.post('/api/activate-user', userController.activateUser);
    // Users
    app.get('/api/user/:id', userController.getUser);
    app.put('/api/update-user', md_auth.auth, userController.updateUser);
    // User novels & collaborations
    app.get('/api/user-novels', md_auth.EditorAuth, userController.getUserNovels);
    // Passwords
    app.post('/api/password-reset-request', userController.passwordResetRequest);
    app.post('/api/password-reset', md_auth.changePasswordTokenAuth, userController.updateUserPassword);
    app.get('/api/password-reset-access', md_auth.changePasswordTokenAuth, userController.passwordResetAccess);
    // Imgs
    app.post('/api/upload-user-profile-img/:id', [md_auth.auth, md_upload], userController.uploadUserProfileImg);
    // Bookmarks
    app.get('/api/get-user-bookmarks', md_auth.auth, userController.getUserBookmarks);
    app.post('/api/create-user-bookmark', md_auth.auth, userController.createUserbookmark);
    app.put('/api/update-user-bookmark', md_auth.auth, userController.updateUserbookmark);
    app.delete('/api/delete-user-bookmark/:id', md_auth.auth, userController.removeUserbookmark);
    // Invitations
    app.post('/api/create-user-invitation', md_auth.auth, userController.createUserInvitation);
    app.put('/api/update-user-invitation', md_auth.auth, userController.updateUserInvitation);
    app.get('/api/get-user-invitations', md_auth.auth, userController.getUserInvitations);
    // Notifications
    app.get('/api/get-user-notifications/:limit', md_auth.auth, userController.getUserNotifications);
    app.get('/api/get-user-unread-notifications', md_auth.auth, userController.getUnreadUserNotifications);
};