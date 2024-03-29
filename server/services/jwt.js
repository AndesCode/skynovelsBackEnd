/*jshint esversion: 6 */
const njwt = require('njwt');

// Password recovery token
exports.createPasswordRecoveryToken = (user) => {
    const signingKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const params = {
        sub: user.id,
    };
    const jwt = njwt.create(params, signingKey, 'HS384');
    const t = new Date();
    t.setHours(t.getHours() + 1);
    jwt.setExpiration(t);
    const token_data = {
        token: jwt.compact(),
        key: signingKey
    };
    return token_data;
};

// User FrontEnd session token
exports.createSessionToken = (user) => {
    const signingKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let params;
    if (user.user_rol === 'User') {
        params = {
            sub: user.id,
            user_login: user.user_login,
            user_forum_auth: user.user_forum_auth,
            image: user.image
        };
    } else {
        params = {
            sub: user.id,
            user_login: user.user_login,
            user_forum_auth: user.user_forum_auth,
            image: user.image,
            user_rol: user.user_rol
        };
    }
    const jwt = njwt.create(params, signingKey);
    const t = new Date();
    t.setSeconds(t.getSeconds() + 1);
    jwt.setExpiration(t);
    token = jwt.compact();
    return token;
};

// Editor token
exports.createEditorToken = (user) => {
    const signingKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const params = {
        sub: user.id,
        user_login: user.user_login,
        user_forum_auth: user.user_forum_auth,
        image: user.image,
        user_rol: user.user_rol
    };
    const jwt = njwt.create(params, signingKey, 'HS512');
    const t = new Date();
    t.setSeconds(t.getSeconds() + 1);
    jwt.setExpiration(t);
    const token_data = {
        token: jwt.compact(),
        key: signingKey
    };
    return token_data;
};

// User administrator token
exports.createAdminToken = (user) => {
    const signingKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const params = {
        sub: user.id,
        user_login: user.user_login,
        user_forum_auth: user.user_forum_auth,
        image: user.image,
        user_rol: user.user_rol
    };
    const jwt = njwt.create(params, signingKey, 'HS512');
    const t = new Date();
    t.setHours(t.getHours() + 1);
    jwt.setExpiration(t);
    const token_data = {
        token: jwt.compact(),
        key: signingKey
    };
    return token_data;
};