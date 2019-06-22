/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const usuarios = sequelize.define('usuarios', {
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
                    usuarios.findOne({ where: { user_login: value } })
                        .then(function(usuarios) {
                            if (usuarios && self.id !== usuarios.id) {
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
            validate: {
                isUnique: function(value, next) {
                    var self = this;
                    usuarios.findOne({ where: { user_email: value } })
                        .then(function(usuarios) {
                            if (usuarios && self.id !== usuarios.id) {
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

    return usuarios;
};