/*jshint esversion: 6 */
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const advertisements_comments = sequelize.define('advertisements_comments', {
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
        adv_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        adv_comment: DataTypes.STRING(1500),
    });

    advertisements_comments.associate = function(models) {
        console.log('Inicia asociaciones');
        advertisements_comments.belongsTo(models.advertisements, {
            foreignKey: 'adv_id',
            as: 'advertisement'
        });
        advertisements_comments.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        advertisements_comments.hasMany(models.likes, {
            foreignKey: 'adv_comment_id',
            as: 'likes',
        });
    };

    return advertisements_comments;
};