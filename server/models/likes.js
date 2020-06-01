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
                isUniqueNovelChapter: function(value, next) {
                    if (value) {
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { novel_rating_id: value }]
                                }
                            }).then(function(novel_rating_like) {
                                if (novel_rating_like && self.id !== novel_rating_like.id) {
                                    return next({ message: 'error, No puedes dar like dos veces a un mismo elemento' });
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
        novel_rating_comment_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    if (value) {
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { novel_rating_comment_id: value }]
                                }
                            }).then(function(novel_rating_comment_like) {
                                if (novel_rating_comment_like && self.id !== novel_rating_comment_like.id) {
                                    return next({ message: 'error, No puedes dar like dos veces a un mismo elemento' });
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
        chapter_comment_reply_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    if (value) {
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { chapter_comment_reply_id: value }]
                                }
                            }).then(function(chapter_comment_reply_like) {
                                if (chapter_comment_reply_like && self.id !== chapter_comment_reply_like.id) {
                                    return next({ message: 'error, No puedes dar like dos veces a un mismo elemento' });
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
        chapter_comment_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    if (value) {
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { chapter_comment_id: value }]
                                }
                            }).then(function(chapter_comment_like) {
                                if (chapter_comment_like && self.id !== chapter_comment_like.id) {
                                    return next({ message: 'error, No puedes dar like dos veces a un mismo elemento' });
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
                isUniqueNovelChapter: function(value, next) {
                    if (value) {
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { adv_id: value }]
                                }
                            }).then(function(advertisement_like) {
                                if (advertisement_like && self.id !== advertisement_like.id) {
                                    return next({ message: 'error, No puedes dar like dos veces a un mismo elemento' });
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
        adv_comment_reply_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    if (value) {
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { adv_comment_reply_id: value }]
                                }
                            }).then(function(adv_comment_reply_like) {
                                if (adv_comment_reply_like && self.id !== adv_comment_reply_like.id) {
                                    return next({ message: 'error, No puedes dar like dos veces a un mismo elemento' });
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
        adv_comment_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUniqueNovelChapter: function(value, next) {
                    if (value) {
                        const self = this;
                        likes.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, { adv_comment_id: value }]
                                }
                            }).then(function(adv_comment_like) {
                                if (adv_comment_like && self.id !== adv_comment_like.id) {
                                    return next({ message: 'error, No puedes dar like dos veces a un mismo elemento' });
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
        likes.belongsTo(models.novels_ratings_comments, {
            foreignKey: 'novel_rating_comment_id',
            as: 'novel_rating_comment'
        });
        likes.belongsTo(models.chapters_comments, {
            foreignKey: 'chapter_comment_id',
            as: 'chapter_comment'
        });
        likes.belongsTo(models.chapters_comments_replys, {
            foreignKey: 'chapter_comment_reply_id',
            as: 'chapter_comment_reply'
        });
        likes.belongsTo(models.advertisements, {
            foreignKey: 'adv_id',
            as: 'advertisement'
        });
        likes.belongsTo(models.advertisements_comments_replys, {
            foreignKey: 'adv_comment_reply_id',
            as: 'advertisement_comment_reply'
        });
        likes.belongsTo(models.advertisements_comments, {
            foreignKey: 'adv_comment_id',
            as: 'advertisement_comment'
        });
        likes.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return likes;
};