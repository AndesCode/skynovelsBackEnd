/*jshint esversion: 6 */
const forumController = require('../controllers').forum;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    // Categories
    app.get('/api/forum-categories', forumController.getCategories);
    app.get('/api/forum-category/:category', forumController.getCategory);
    // Posts
    app.get('/api/forum-post/:id', forumController.getPost);
    app.post('/api/create-forum-post', md_auth.forumAuth, forumController.createPost);
    app.put('/api/update-forum-post', md_auth.forumAuth, forumController.updatePost);
    app.delete('/api/delete-forum-post/:id', md_auth.forumAuth, forumController.deletePost);
    // Comments
    app.post('/api/create-post-comment', md_auth.forumAuth, forumController.createComment);
    app.put('/api/update-post-comment', md_auth.forumAuth, forumController.updateComment);
    app.delete('/api/delete-post-comment/:id', md_auth.forumAuth, forumController.deleteComment);
};