/*jshint esversion: 6 */
const notifications_model = require('../models').notifications;

function createLikeNotification(likeId, model, objectId, objectName) {
    console.log(objectId);
    console.log(objectName);
    model.findByPk(objectId).then(object => {
        notifications_model.create({
            user_id: object.user_id,
            like_id: likeId
        }).then((notification) => {
            console.log(notification);
        }).catch(err => {
            const message = 'Ocurrio un error al cargar el objeto';
            console.log('error');
            return message;
        });
    }).catch(err => {
        const message = 'Ocurrio un error al cargar el objeto';
        console.log('error');
        return message;
    });
}

module.exports = {
    createLikeNotification
};