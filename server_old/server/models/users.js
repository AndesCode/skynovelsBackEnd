/*jshint esversion: 6 */
const bcrypt = require('bcrypt');
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
                len: {
                    args: [2, 12],
                    msg: 'El login de usuario debe tener entre 2 y 12 caracteres'
                },
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
            type: DataTypes.STRING(75),
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
                isEmail: {
                    msg: 'El email indicado no es valido'
                },
                len: {
                    args: [1, 75],
                    msg: 'El email de usuario debe tener entre 1 y 75 caracteres'
                },
            }
        },
        user_rol: {
            type: DataTypes.STRING(6),
            validate: {
                isIn: {
                    args: [
                        ['User', 'Admin', 'Editor']
                    ],
                    msg: 'El rol que se intenta asignar no esta permitido'
                }
            }
        },
        user_status: {
            type: DataTypes.STRING(8),
            validate: {
                isIn: {
                    args: [
                        ['Active', 'Disabled']
                    ],
                    msg: 'El estado de usuario que se intenta asignar no esta permitido'
                }
            }
        },
        user_forum_auth: {
            type: DataTypes.STRING(8),
            validate: {
                isIn: {
                    args: [
                        ['Active', 'Disabled']
                    ],
                    msg: 'El estado de acceso al foro que se intenta asignar no esta permitido'
                }
            }
        },
        user_verification_key: DataTypes.STRING(256),
        image: {
            type: DataTypes.STRING(250),
            validate: {
                len: [0, 250],
            }
        },
        user_description: {
            type: DataTypes.STRING(500),
            validate: {
                len: {
                    args: [0, 500],
                    msg: 'La descripción de usuario debe tener entre 0 y 500 caracteres'
                },
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
    });

    return users;
};