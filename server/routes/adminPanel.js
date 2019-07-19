const adminPanelController = require('../controllers').adminPanel;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    app.get('/api/admin-get-all-posts', adminPanelController.getAllPosts);

};