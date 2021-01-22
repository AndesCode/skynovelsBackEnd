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
let userSocketIdMap;

function emit(eventName, data) {
    io.sockets.emit(eventName, data);
}

function notifyUser(user_id) {
    notifications_model.sequelize.query('SELECT COUNT(n.id) AS user_unread_notifications_count FROM notifications n WHERE n.user_id = ? AND n.readed = false', { replacements: [user_id], type: notifications_model.sequelize.QueryTypes.SELECT })
        .then((notifications) => {
            console.log(getByValue(userSocketIdMap, user_id));
            if (getByValue(userSocketIdMap, user_id)) {
                io.to(getByValue(userSocketIdMap, user_id)).emit('test event', notifications[0]);
            }
        }).catch(err => {
            console.log('error al mandar notificación al usuario');
        });
}

function setOnlineUsers(usersOnlineMap) {
    userSocketIdMap = usersOnlineMap;
    console.log('service');
    console.log(userSocketIdMap);
    return;
}

function getByValue(map, searchValue) {
    for (let [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
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