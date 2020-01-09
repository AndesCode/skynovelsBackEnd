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
            type: DataTypes.INTEGER
        },
        user_login: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
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
            type: DataTypes.STRING,
            allowNull: false
                /*validate: {
                    is: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z_.\d]{8,16}$/i
                }*/
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
                isEmail: true
            }
        },
        user_rol: DataTypes.INTEGER,
        user_status: DataTypes.STRING,
        user_forum_auth: DataTypes.STRING,
        user_verification_key: DataTypes.STRING,
        user_profile_image: DataTypes.STRING,
        user_description: DataTypes.STRING
    });

    users.associate = function(models) {
        console.log('Inicia asociaciones colaboradores-novelas');
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
        users.hasMany(models.novels, {
            foreignKey: 'nvl_author',
            as: 'novels',
        });
        users.hasMany(models.user_reading_lists, {
            foreignKey: 'user_id',
            as: 'user_reading_lists',
        });
        users.hasMany(models.forum_posts, {
            foreignKey: 'post_author_id',
            as: 'forum_posts',
        });
        users.hasMany(models.posts_comments, {
            foreignKey: 'comment_author_id',
            as: 'forum_comments',
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