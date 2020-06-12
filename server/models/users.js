/*jshint esversion: 6 */
const config = require('../config/config');
// Encrypters
const bcrypt = require('bcrypt');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(config.key);
const saltRounds = 10;

module.exports = (sequelize, DataTypes) => {
    const users = sequelize.define('users', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        user_login: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [2, 12],
                isUnique: function(value, next) {
                    const self = this;
                    users.findOne({ where: { user_login: value } })
                        .then(function(users) {
                            if (users && self.id !== users.id) {
                                return next({ message: 'El login de usuario ya esta en uso' });
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                is: /^[a-zA-Z\u00d1\u00f1]{3}(?=.{2,12}$)(?![0-9])[a-zA-Z0-9\u00d1\u00f1]+$/i
            }
        },
        user_pass: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        user_email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isUnique: function(value, next) {
                    const self = this;
                    users.findOne({ where: { user_email: value } })
                        .then(function(users) {
                            if (users && self.id !== users.id) {
                                return next('El email indicado ya esta en uso');
                            }
                            return next();
                        })
                        .catch(function(err) {
                            return next(err);
                        });
                },
                isEmail: true,
                len: [1, 75],
            }
        },
        user_rol: {
            type: DataTypes.STRING(6),
            validate: {
                isIn: [
                    ['User', 'Admin', 'Editor']
                ],
            }
        },
        user_status: {
            type: DataTypes.STRING(8),
            validate: {
                isIn: [
                    ['Active', 'Disabled']
                ],
            }
        },
        user_forum_auth: {
            type: DataTypes.STRING(8),
            validate: {
                isIn: [
                    ['Active', 'Disabled']
                ],
            }
        },
        user_verification_key: DataTypes.STRING,
        user_profile_image: {
            type: DataTypes.STRING(65),
            validate: {
                len: [0, 65],
            }
        },
        user_description: {
            type: DataTypes.STRING(500),
            validate: {
                len: [0, 500],
            }
        },
    });

    users.associate = function(models) {
        users.belongsToMany(models.novels, {
            through: 'novels_collaborators',
            as: 'collaborations',
            foreignKey: 'user_id'
        });
        users.hasMany(models.invitations, {
            foreignKey: 'invitation_to_id',
            as: 'invitations',
        });
        users.hasMany(models.novels_ratings, {
            foreignKey: 'user_id',
            as: 'novels_ratings',
        });
        users.hasMany(models.chapters, {
            foreignKey: 'chp_author',
            as: 'chapters',
        });
        users.hasMany(models.comments, {
            foreignKey: 'user_id',
            as: 'comments',
        });
        users.hasMany(models.replys, {
            foreignKey: 'user_id',
            as: 'replys',
        });
        users.hasMany(models.novels, {
            foreignKey: 'nvl_author',
            as: 'novels',
        });
        users.hasMany(models.bookmarks, {
            foreignKey: 'user_id',
            as: 'bookmarks',
        });
        users.hasMany(models.forum_posts, {
            foreignKey: 'post_author_id',
            as: 'forum_posts',
        });
        users.hasMany(models.posts_comments, {
            foreignKey: 'comment_author_id',
            as: 'post_comments',
        });
        users.hasMany(models.volumes, {
            foreignKey: 'user_id',
            as: 'volumes',
        });
        users.hasMany(models.likes, {
            foreignKey: 'user_id',
            as: 'likes',
        });
    };

    users.beforeCreate((user, options) => {
        const salt = bcrypt.genSaltSync(saltRounds);
        user.user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        user.user_pass = bcrypt.hashSync(user.user_pass, salt);
        // console.log(options);
    });

    return users;
};