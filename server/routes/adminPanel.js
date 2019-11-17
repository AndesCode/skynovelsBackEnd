const adminPanelController = require('../controllers').adminPanel;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    app.post('/api/admin-get-all-posts', md_auth.adminAuth, adminPanelController.getAllPosts);
    app.put('/api/admin-update-user', md_auth.adminAuth, adminPanelController.adminUserDataUpdate);
    app.post('/api/admin-verification', md_auth.adminAuth, adminPanelController.adminVerification);

};