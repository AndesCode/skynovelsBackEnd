/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
module.exports = (sequelize, DataTypes) => {
    const likes = sequelize.define('likes', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        novel_rating_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUnique: function(value, next) {
                    if (value) {
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { novel_rating_id: value }]
                                }
                            }).then(function(novel_rating_like) {
                                if (novel_rating_like && self.id !== novel_rating_like.id) {
                                    return next({ message: 'Error, No puedes dar like dos veces a un mismo elemento' });
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
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { reply_id: value }]
                                }
                            }).then(function(reply_like) {
                                if (reply_like && self.id !== reply_like.id) {
                                    return next({ message: 'Error, No puedes dar like dos veces a un mismo elemento' });
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
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { comment_id: value }]
                                }
                            }).then(function(comment_like) {
                                if (comment_like && self.id !== comment_like.id) {
                                    return next({ message: 'Error, No puedes dar like dos veces a un mismo elemento' });
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
        adv_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUnique: function(value, next) {
                    if (value) {
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { adv_id: value }]
                                }
                            }).then(function(advertisement_like) {
                                if (advertisement_like && self.id !== advertisement_like.id) {
                                    return next({ message: 'Error, No puedes dar like dos veces a un mismo elemento' });
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
    }, {
        timestamps: false,
    });

    likes.associate = function(models) {
        likes.belongsTo(models.novels_ratings, {
            foreignKey: 'novel_rating_id',
            as: 'novel_rating'
        });
        likes.belongsTo(models.advertisements, {
            foreignKey: 'adv_id',
            as: 'advertisement'
        });
        likes.belongsTo(models.comments, {
            foreignKey: 'comment_id',
            as: 'comment'
        });
        likes.belongsTo(models.replys, {
            foreignKey: 'reply_id',
            as: 'reply'
        });
        likes.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return likes;
};