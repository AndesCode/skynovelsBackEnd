/*jshint esversion: 6 */
const njwt = require('njwt');

exports.createToken = (user) => {
    const signingKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const params = {
        sub: user.id,
        user_login: user.user_login,
        user_rol: user.user_rol
    };
    const jwt = njwt.create(params, signingKey);
    const t = new Date();
    t.setHours(t.getHours() + 1);
    jwt.setExpiration(t);
    const token_data = {
        token: jwt.compact(),
        key: signingKey
    };
    return token_data;
};