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
                    var self = this;
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
                }
            }
        },
        user_pass: DataTypes.STRING,
        user_email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            isEmail: true,
            validate: {
                isUnique: function(value, next) {
                    var self = this;
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
                }
            }
        },
        user_rol: DataTypes.INTEGER,
        user_status: DataTypes.STRING,
        user_forum_auth: DataTypes.STRING,
        user_verification_key: DataTypes.STRING,
        user_profile_image: DataTypes.STRING,
        user_description: DataTypes.STRING,
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE

    });

    users.beforeCreate((user, options) => {
        console.log('Ejecutando before create');
        console.log(user.id);
        const user_verification_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const crypted_verification_key = cryptr.encrypt(user_verification_key);
        user.user_verification_key = crypted_verification_key;
        const salt = bcrypt.genSaltSync(saltRounds);
        user.user_pass = bcrypt.hashSync(user.user_pass, salt);
        // console.log(options);
    });
    return users;
};