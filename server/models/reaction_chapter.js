/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
module.exports = (sequelize, DataTypes) => {
    const reaction_chapters= sequelize.define('reaction_chapters', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        chapter_id: {
            type: DataTypes.INTEGER,
            validate: {
                isUnique: function(value, next) {
                    if (value) {
                        reaction_chapters.findOne({
                                where: {
                                    [Op.and]: [{ user_id: this.user_id }, {chapter_id: value }]
                                }
                            }).then(function(chapter_reaction) {
                                if (chapter_reaction) {
                                    return next({ message: 'Error, No puedes reacccionar dos veces a un mismo elemento' });
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
            reaction_id: {
                type: DataTypes.INTEGER,
                allowNull:  true,
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
        }
    
}, {
        timestamps: false,
    });

    reaction_chapters.associate = function(models) {
        reaction_chapters.belongsTo(models.chapters, {
            foreignKey: 'chapter_id',
            as: 'chapter'
        });
        reaction_chapters.belongsTo(models.users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        // reaction_chapters.belongsTo(models.reaction, {
        //     foreignKey: 'reaction_id',
        //     as: 'reactions',
        //   });
    };

    return reaction_chapters;
};