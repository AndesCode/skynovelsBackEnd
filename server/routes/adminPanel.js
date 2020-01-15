/*jshint esversion: 6 */
const adminPanelController = require('../controllers').adminPanel;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    /*app.post('/api/admin-get-all-posts', md_auth.adminAuth, adminPanelController.getAllPosts);
    app.put('/api/admin-update-user', md_auth.adminAuth, adminPanelController.adminUserDataUpdate);
    app.post('/api/admin-verification', md_auth.adminAuth, adminPanelController.adminVerification);
    app.get('/api/self-service-user/:id', md_auth.auth, adminPanelController.getUserModificable);*/

    app.get('/api/admin-panel', md_auth.adminAuth, adminPanelController.adminPanelAccess);


};