/*jshint esversion: 6 */
const SocketIo = require('socket.io');
const notifications_model = require('../models').notifications;
const isProd = process.env.NODE_ENV === 'production' ? true : false;
if (isProd) {
    allowedOrigin = 'https://www.skynovels.net';
} else {
    allowedOrigin = 'http://localhost:4200';
    //allowedOrigin = 'http://localhost:8100';
}
let io;
let usersSocketsConnections;

function emit(eventName, data) {
    io.sockets.emit(eventName, data);
}

function notifyUser(user_id) {
    notifications_model.sequelize.query('SELECT COUNT(n.id) AS user_unread_notifications_count FROM notifications n WHERE n.user_id = ? AND n.readed = false', { replacements: [user_id], type: notifications_model.sequelize.QueryTypes.SELECT })
        .then((notifications) => {
            if (usersSocketsConnections.find(x => x.user_id === user_id)) {
                const socket_info = usersSocketsConnections.find(x => x.user_id === user_id);
                io.to(socket_info.socket_id).emit('userNotificationEvent', notifications[0]);
            } else {
                return;
            }
        }).catch(err => {
            return;
        });
}

function setOnlineUsers(usersOnline) {
    usersSocketsConnections = usersOnline;
    return;
}

module.exports = {
    init: function(server) {
        // start socket.io server and cache io value
        io = SocketIo(server, {
            cors: {
                origin: allowedOrigin,
                // methods: ["GET", "POST", "PUT"],
                // allowedHeaders: ["my-custom-header"],
                credentials: true
            }
        });
        return io;
    },
    getio: function() {
        // return previously cached value
        if (!io) {
            throw new Error("must call .init(server) before you can call .getio()");
        }
        return io;
    },
    emit,
    notifyUser,
    setOnlineUsers
};