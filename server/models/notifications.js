/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
module.exports = (sequelize, DataTypes) => {
    const notifications = sequelize.define('notifications', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        like_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUnique: function(value, next) {
                    if (value) {
                        notifications.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { like_id: value }]
                                }
                            }).then(function(like_notification) {
                                if (like_notification) {
                                    return next({ message: 'Error, no se puede notificar dos veces el mismo elemento' });
                                } else {
                                    return next();
                                }
                            })
                            .catch(function(err) {
                                return next(err);
                            });
                    } else {
                        return next();
                    }
                },
                isNumeric: true,
            }
        },
        novel_rating_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUnique: function(value, next) {
                    if (value) {
                        notifications.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { novel_rating_id: value }]
                                }
                            }).then(function(novel_rating_notification) {
                                if (novel_rating_notification) {
                                    return next({ message: 'Error, no se puede notificar dos veces el mismo elemento' });
                                } else {
                                    return next();
                                }
                            })
                            .catch(function(err) {
                                return next(err);
                            });
                    } else {
                        return next();
                    }
                },
                isNumeric: true,
            }
        },
        reply_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUnique: function(value, next) {
                    if (value) {
                        notifications.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { reply_id: value }]
                                }
                            }).then(function(reply_notification) {
                                if (reply_notification) {
                                    return next({ message: 'Error, no se puede notificar dos veces el mismo elemento' });
                                } else {
                                    return next();
                                }
                            })
                            .catch(function(err) {
                                return next(err);
                            });
                    } else {
                        return next();
                    }
                },
                isNumeric: true,
            }
        },
        comment_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUnique: function(value, next) {
                    if (value) {
                        notifications.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { comment_id: value }]
                                }
                            }).then(function(comment_notification) {
                                if (comment_notification) {
                                    return next({ message: 'Error, no se puede notificar dos veces el mismo elemento' });
                                } else {
                                    return next();
                                }
                            })
                            .catch(function(err) {
                                return next(err);
                            });
                    } else {
                        return next();
                    }
                },
                isNumeric: true,
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        readed: DataTypes.BOOLEAN,
    });

    notifications.associate = function(models) {
        notifications.belongsTo(models.novels_ratings, {
            foreignKey: 'novel_rating_id',
            as: 'novel_rating'
        });
        notifications.belongsTo(models.likes, {
            foreignKey: 'like_id',
            as: 'like'
        });
        notifications.belongsTo(models.comments, {
            foreignKey: 'comment_id',
            as: 'comment'
        });
        notifications.belongsTo(models.replys, {
            foreignKey: 'reply_id',
            as: 'reply'
        });
        notifications.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return notifications;
};