/*jshint esversion: 6 */
const adminPanelController = require('../controllers').adminPanel;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    // Admin panel access
    app.get('/api/admin-panel', md_auth.adminAuth, adminPanelController.adminPanelAccess);
    // Forum categories
    app.post('/api/create-forum-category', md_auth.adminAuth, adminPanelController.createCategory);
    app.put('/api/update-forum-category', md_auth.adminAuth, adminPanelController.updateCategory);
    app.delete('/api/delete-forum-category/:id', md_auth.adminAuth, adminPanelController.deleteCategory);
    // Users 
    app.delete('/api/delete-user/:id', md_auth.adminAuth, adminPanelController.deleteUser);
    app.get('/api/users/:status', md_auth.adminAuth, adminPanelController.getUsers);
};