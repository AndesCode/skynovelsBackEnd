/*jshint esversion: 6 */
const usuariosController = require('../controllers').usuarios;
const md_auth = require('../authenticated/authenticated');
const cm = require('connect-multiparty');
const md_upload = cm({ uploadDir: './server/uploads/usuarios' });

module.exports = (app) => {
    app.post('/api/create-user', usuariosController.create);
    app.post('/api/login', usuariosController.login);
    app.get('/api/usuarios', md_auth.auth, usuariosController.getAll);
    app.get('/api/user/email-verification/:key', usuariosController.activateUser);
    app.post('/api/user/password-reset', usuariosController.passwordResetRequest);
    app.get('/api/usuario/:id', md_auth.auth, usuariosController.getUser);
    app.put('/api/update-user-password', md_auth.emailVerificationAuth, usuariosController.updateUserPassword);
    app.put('/api/update-user/:id', md_auth.auth, usuariosController.update);
    app.get('/api/user/get-user-by-email-token/:token', md_auth.emailVerificationAuth, usuariosController.getUserByEmailToken);
    app.post('/api/upload-profile-img/:id', [md_auth.auth, md_upload], usuariosController.uploadUserProfileImg);
    app.get('/api/usuario/image/:profile_img/:thumb', usuariosController.getUserProfileImage);
};