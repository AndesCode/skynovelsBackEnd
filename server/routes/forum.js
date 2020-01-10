/*jshint esversion: 6 */
const forumController = require('../controllers').forum;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    // Categories
    app.get('/api/forum-categories', forumController.getCategories);
    app.get('/api/forum-category/:category', forumController.getCategory);
    app.post('/api/create-forum-category', forumController.createCategory);
    app.put('/api/update-forum-category', forumController.updateCategory);
    app.delete('/api/delete-forum-category/:id', forumController.deleteCategory);
    // Posts
    app.get('/api/forum-post/:id', forumController.getPost);
    app.post('/api/create-forum-post', forumController.createPost);
    app.put('/api/update-forum-post', forumController.updatePost);
    app.delete('/api/delete-forum-post/:id', forumController.deletePost);
    // Comments
    app.post('/api/create-post-comment', forumController.createComment);
    app.put('/api/update-post-comment', forumController.updateComment);
    app.delete('/api/delete-post-comment/:id', forumController.deleteComment);

};