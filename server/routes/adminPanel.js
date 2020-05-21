/*jshint esversion: 6 */
const adminPanelController = require('../controllers').adminPanel;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    // Admin panel access
    app.get('/api/admin-panel', md_auth.adminAuth, adminPanelController.adminPanelAccess);
    // Forum categories
    app.get('/api/admin-get-categories', md_auth.adminAuth, adminPanelController.adminGetCategories);
    app.post('/api/admin-create-forum-category', md_auth.adminAuth, adminPanelController.adminCreateCategory);
    app.put('/api/admin-update-forum-category', md_auth.adminAuth, adminPanelController.adminUpdateCategory);
    app.delete('/api/admin-delete-forum-category/:id', md_auth.adminAuth, adminPanelController.adminDeleteCategory);
    // forum posts
    app.put('/api/admin-update-forum-post', md_auth.adminAuth, adminPanelController.adminUpdatePost);
    app.delete('/api/admin-delete-forum-post/:id', md_auth.adminAuth, adminPanelController.adminDeletePost);
    app.get('/api/admin-get-forum-posts', md_auth.adminAuth, adminPanelController.adminGetPosts);
    // forum comments
    app.put('/api/admin-update-post-comment', md_auth.adminAuth, adminPanelController.adminUpdateComment);
    app.delete('/api/admin-delete-post-comment/:id', md_auth.adminAuth, adminPanelController.adminDeleteComment);
    // Users 
    app.get('/api/admin-users', md_auth.adminAuth, adminPanelController.adminGetUsers);
    app.get('/api/admin-user/:id', md_auth.adminAuth, adminPanelController.adminGetUser);
    app.put('/api/admin-update-user', md_auth.adminAuth, adminPanelController.adminUpdateUser);
    app.delete('/api/admin-delete-user/:id', md_auth.adminAuth, adminPanelController.adminDeleteUser);
    // novels
    app.get('/api/admin-novel/:id', md_auth.adminAuth, adminPanelController.adminGetNovel);
    app.get('/api/admin-novels', md_auth.adminAuth, adminPanelController.adminGetNovels);
    app.put('/api/admin-update-novel', md_auth.adminAuth, adminPanelController.adminUpdateNovel);
    app.delete('/api/admin-delete-novel/:id', md_auth.adminAuth, adminPanelController.adminDeleteNovel);
    app.post('/api/admin-create-recommended-novel', md_auth.adminAuth, adminPanelController.adminCreateRecommendedNovel);
    // Volumes
    app.put('/api/admin-update-volume', md_auth.adminAuth, adminPanelController.adminUpdateNovelVolume);
    app.delete('/api/admin-delete-volume/:id', md_auth.adminAuth, adminPanelController.adminDeleteNovelVolume);
    // Chapters
    app.get('/api/admin-get-chapter/:id', md_auth.adminAuth, adminPanelController.adminGetChapter);
    app.put('/api/admin-update-chapters', md_auth.adminAuth, adminPanelController.adminUpdateChapter);
    app.delete('/api/admin-delete-chapter/:id', md_auth.adminAuth, adminPanelController.adminDeleteChapter);
    // Genres
    app.post('/api/admin-create-genre', md_auth.adminAuth, adminPanelController.adminCreateGenre);
    app.put('/api/admin-update-genre', md_auth.adminAuth, adminPanelController.adminUpdateGenre);
    app.delete('/api/admin-delete-genre/:id', md_auth.adminAuth, adminPanelController.adminDeleteGenre);
};