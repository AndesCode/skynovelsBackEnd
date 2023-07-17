/*jshint esversion: 6 */
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
module.exports = (sequelize, DataTypes) => {
    const reaction = sequelize.define('reaction ', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER,
            validate: {
                isNumeric: true
            }
        },
        reaction_name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isString: true
            }
        },
        reaction_icon: {
            type: DataTypes.STRING(250),
            validate: {
                len: [0, 250],
            }
        }
    },
        {
            timestamps: false,
        });

      
        reaction.associate = function(models) {
            reaction.hasMany(models.reaction_chapters, {
                foreignKey: 'id',
                as: 'reaction_chapters',
              });
          };

    return reaction;
};