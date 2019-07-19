const forumController = require('../controllers').forum;
const md_auth = require('../authenticated/authenticated');

module.exports = (app) => {

    app.post('/api/forum-create', md_auth.forumAuth, forumController.create);
    app.put('/api/forum-update/:id', forumController.update);
    app.get('/api/forum-get', forumController.getForum);
};