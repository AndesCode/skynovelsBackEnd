const forum = require('../models').forum;

function getAllPosts(req, res){
        var type = req.params.type;
        forum.sequelize.query("SELECT (SELECT(select u.user_login from users u where u.id = p.post_author_id) from posts p where p.forum_type_id = forum.id ORDER BY createdAt DESC LIMIT 1) AS last_user_posted, (SELECT p.post_title FROM posts p where p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_title,forum.forum_type, COUNT(*) as forum_posts_count, (SELECT p.id FROM posts p where p.forum_type_id=forum.id ORDER BY createdAt DESC LIMIT 1) AS last_post_id FROM posts p, forum WHERE p.forum_type_id = forum.id GROUP BY p.forum_type_id", { type: forum.sequelize.QueryTypes.SELECT }).then(adminPanel => {
        res.status(200).send({ adminPanel });
        }).catch(err => {
         res.status(500).send({ message: 'Ocurrio un error' + err });
        });
    }


module.exports = {
    getAllPosts
};