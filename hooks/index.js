'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');


exports.before = {
  all: [],
  create: []
};

exports.after = {
  all: [],
  create: [
    function(hook) {
      hook.legacyLogin = 1;
      if (hook.result.accessToken) {
        return hook.app.passport.verifyJWT(hook.result.accessToken, {secret: hook.app.get('auth').secret}).then(function(res) {
          return hook.app.service('users').get(res.userId).then(function(user) {
            hook.result.data = user;
            hook.result.token = hook.result.accessToken;
            return Promise.resolve();
          });
        });
      }
    }
  ]
};
