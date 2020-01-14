/*jshint esversion: 6 */
const userController = require('../controllers').users;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/users' });

module.exports = (app) => {
    /*
    
    app.get('/api/users', md_auth.auth, userController.getAll);
    app.get('/api/user/email-verification/:key', userController.activateUser);
    
    app.get('/api/user/:id', userController.getUser);
    app.put('/api/update-user-password', md_auth.emailVerificationAuth, userController.updateUserPassword);
    app.get('/api/user/get-user-by-email-token/:token', md_auth.emailVerificationAuth, userController.getUserByEmailToken);
    app.post('/api/upload-profile-img/:id', [md_auth.auth, md_upload], userController.uploadUserProfileImg);
    app.get('/api/user/image/:profile_img/:thumb', userController.getUserProfileImage);
    app.post('/api/create-user-reading-list', md_auth.auth, userController.createUserReadingList);
    app.get('/api/find-user-reading-list/:id', md_auth.auth, userController.findUserReadingList);
    app.delete('/api/remmove-user-bookmark/:nvl/:uid', md_auth.auth, userController.removeUserReadingList);
    app.get('/api/check-novel-bookmark/:nvl/:uid', md_auth.auth, userController.checkNovelIsBookmarked);
    app.put('/api/update-user-bookmark', md_auth.auth, userController.updateUserReadingListItem);
    app.post('/api/search-user', md_auth.auth, userController.searchUserByName);
    app.post('/api/send-invitation-to-user', md_auth.auth, userController.createUserInvitation);
    app.put('/api/update-user-invitation', md_auth.auth, userController.updateUserInvitation);
    app.get('/api/get-user-invitations/:id', md_auth.auth, userController.getUserInvitations);
    app.post('/api/create-novel-collaborator', md_auth.auth, userController.createNovelCollaborator);
    app.delete('/api/delete-novel-collaborator/:id', md_auth.auth, userController.DeleteNovelCollaborator);*/

    app.get('/api/user/:id', userController.getUser);
    app.get('/api/users/:status', userController.getUsers); // admin authorization require
    app.post('/api/create-user', userController.createUser);
    app.post('/api/login', userController.login);
    app.post('/api/password-reset-request', userController.passwordResetRequest);
    app.post('/api/password-reset', md_auth.changePasswordTokenAuth,  userController.updateUserPassword);
    app.get('/api/logout', userController.logout);
    app.post('/api/activate-user/:key', userController.activateUser);
    app.put('/api/update-user', userController.updateUser); // loged user require md_auth.auth,
    app.delete('/api/delete-user/:id', userController.deleteUser); // admin authorization require md_auth.adminAuth,
    // cookie test
    app.get('/api/cookie-test', md_auth.adminAuth, userController.cookieTest);
};