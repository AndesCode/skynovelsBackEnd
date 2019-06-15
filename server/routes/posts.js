/*jshint esversion: 6 */
const postsController = require('../controllers').posts;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {
    app.post('/api/post-create', md_auth.forumAuth, postsController.create);
    app.put('/api/update-post/:id', md_auth.forumAuth, postsController.update);
    app.get('/api/posts-get/:type', postsController.getPosts);
    app.get('/api/get-comment/:id', postsController.getComment);
    app.get('/api/post-get/:id', postsController.getPost);
    app.post('/api/comment-create', md_auth.forumAuth, postsController.newPostComment);
    app.get('/api/get-post-comments/:id', postsController.getPostComments);
    app.put('/api/update-comment', md_auth.forumAuth, postsController.updateComment);
    app.delete('/api/delete-comment/:id', md_auth.forumAuth, postsController.deleteComment);
    app.delete('/api/delete-post/:id', md_auth.forumAuth, postsController.deletePost);
};