const forum = require('../models').forum;
const posts = require('../models').posts;
const posts_comments = require('../models').posts_comments;

function getAllPosts(req, res) {
    var orderBy = req.params.orderBy;
    console.log(orderBy);
    posts.sequelize.query(`SELECT ( SELECT COUNT(*) FROM posts_comments WHERE posts_comments.forum_topic_id = posts.id ) AS comment_count, forum.forum_type, posts.id, posts.post_author_id, posts.post_title, posts.forum_type_id, users.user_login AS USER FROM forum, posts JOIN users ON posts.post_author_id = users.id WHERE posts.forum_type_id = forum.id ORDER BY ${orderBy};`, { type: posts.sequelize.QueryTypes.SELECT }).then(posts => {
        res.status(200).send({ posts });
    }).catch(err => {
        res.status(500).send({ message: 'Ocurrio un error' + err });
    });
}


module.exports = {
    getAllPosts
};