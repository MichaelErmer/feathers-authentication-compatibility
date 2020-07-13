'use strict';

class Service {
  constructor(options = {}) {
    this.options = Object.assign({}, options);
  }

  setup(app) {
    this.app = app;
    let self = this;
    if (app.io && this.options.socket) {
      app.io.on('connection', function(socket) {
        socket.on('authenticate', function(data) {
          let errorHandler = function(error) {
            socket[emit]('unauthorized', error.message, function(){
            });

            throw error;
          };
          let feathersParams = function(socket) {return socket.feathers}, provider = 'rest', emit = 'emit';
          if (data.token && data.type === 'token') {
            if (typeof data.token !== 'string' && data.type === 'token') {
              return errorHandler(new errors.BadRequest('Invalid token data type.'));
            }

            data.strategy = 'jwt';
            delete data.type;
            data.accessToken = data.token;
            delete data.token;

            const params = Object.assign({ provider }, { body: data });

            // The token gets normalized in hook.params for REST so we'll stay with
            // convention and pass it as params using sockets.
            self.create(data, params).then(response => {
              feathersParams(socket).token = response.token;
              feathersParams(socket).user = response.data;
              response.legacyLogin = true;
              socket[emit]('authenticated', response);
            }).catch(errorHandler);
          }
          // Authenticate the user using local auth strategy
          else {
            // Put our data in a fake req.body object to get local auth
            // with Passport to work because it checks res.body for the
            // username and password.

            // compatibility
            data.strategy = data.strategy || data.type;
            delete data.type;

            let params = { provider, req: socket.request };

            params.req.body = data;

            self.create(data, params).then(response => {
              feathersParams(socket).token = response.token;
              feathersParams(socket).user = response.data;
              response.legacyLogin = true;
              socket[emit]('authenticated', response);
            }).catch(errorHandler);
          }
        });
      });
    }
  }

  create(data, params) {
    return this.app.service('authentication').create(data, params);
  }
}

module.exports = function (options1 = {}) {
  const options = Object.assign({}, {
    path: '/authentication',
    legacyPath: '/auth/local',
    socket: true
  }, options1);

  return function () {
    return authCompatibility(options, this)
  }
}

function authCompatibility (options, app) {
  app.use(options.legacyPath, new Service(options));

  const authenticationCompabilityService = app.service(options.legacyPath);

  authenticationCompabilityService.hooks({
    before: {
      create: [
        beforeAuthenticationCreateHook()
      ]
    }
  });

  authenticationCompabilityService.filter(function (data, connection) { return false; });
};

function returnUserHook (options={}) {
  options = Object.assign({}, {
    userEndpoint: 'users',
    unsetFields: [
      'password'
    ]
  }, options);
  return function (hook) {
    hook.legacyLogin = 1;
    if (hook.result.accessToken) {
      return hook.app.passport.verifyJWT(hook.result.accessToken, {secret: hook.app.get('auth').secret}).then(function(res) {
        return hook.app.service(options.userEndpoint).get(res.userId).then(function(user) {
          hook.result.data = user;
          if (options.unsetFields) {
            for (const field of options.unsetFields) {
              delete user[field];
            }
          }
          return Promise.resolve();
        });
      });
    }
  }
}
function returnLegacyTokenHook (options={}) {
  return function (hook) {
    hook.legacyLogin = 1;
    if (hook.result.accessToken) {
      hook.result.token = hook.result.accessToken;
    }
  }
}

function beforeAuthenticationCreateHook (options={}) {
  return function (hook) {
    if (hook.data.username || hook.data.email) {
      hook.data.strategy = 'local';
    }
    if (hook.data.token) {
      hook.data.strategy = 'jwt';
      hook.data.accessToken = hook.data.token;
      delete hook.data.type; // Authentication strategy 'token' is not registered.
      delete hook.data.token;
    }
    if (hook.data.type) {
      hook.data.strategy = hook.data.type;
      delete hook.data.type;
    }
  }
}

module.exports.afterAuthenticationReturnUserHook = returnUserHook;
module.exports.afterAuthenticationReturnLegacyTokenHook = returnLegacyTokenHook;
module.exports.beforeAuthenticationCreateHook = beforeAuthenticationCreateHook;
module.exports.Service = Service;
