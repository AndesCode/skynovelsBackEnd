/*jshint esversion: 6 */
module.exports = (sequelize, DataTypes) => {
    const comments = sequelize.define('comments', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        chp_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        adv_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        prf_id: {
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        comment_content: {
            type: DataTypes.STRING(2000),
            allowNull: false,
            validate: {
                len: {
                    args: [2, 2000],
                    msg: 'El comentario debe tener entre 2 y 2000 caracteres'
                },
            }
        },
    });

    comments.associate = function(models) {
        comments.belongsTo(models.chapters, {
            foreignKey: 'chp_id',
            as: 'chapter'
        });
        comments.belongsTo(models.advertisements, {
            foreignKey: 'adv_id',
            as: 'advertisement'
        });
        comments.belongsTo(models.advertisements, {
            foreignKey: 'prf_id',
            as: 'profile'
        });
        comments.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        comments.hasMany(models.likes, {
            foreignKey: 'comment_id',
            as: 'likes',
        });
    };

    return comments;
};