'use strict';

class Service {
  constructor(options) {
    this.options = options || {};
  }
  
  setup(app) {
    this.app = app;
    var self = this;
    if (app.io && this.options.socket) {
      app.io.on('connection', function(socket) {
        socket.on('authenticate', function(data) {
          let errorHandler = function(error) {
            socket[emit]('unauthorized', error, function(){
            });

            throw error;
          };
          var feathersParams = function(socket) {return socket.feathers}, provider = 'rest', emit = 'emit';
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

module.exports = function(options){
  const app = this;
  options = options || {
    path: '/authentication',
    legacyPath: '/auth/local',
    socket: true,
    acceptLegacyTokens: true,
    returnUser: true,
    returnToken: true
  };

  app.use(options.legacyPath, new Service(options));

  const authenticationCompabilityService = app.service(options.legacyPath);
  const authentication = app.service(options.path);

  authenticationCompabilityService.filter(function (data, connection) { return false; });

  if (options.returnUser || options.returnToken) {
    authentication.after({
      create: function(hook) {
        hook.legacyLogin = 1;
        if (hook.result.accessToken) {
          if (options.returnToken) {
            hook.result.token = hook.result.accessToken;
          }
          if (options.returnUser) {
            return hook.app.passport.verifyJWT(hook.result.accessToken, {secret: hook.app.get('auth').secret}).then(function(res) {
              return hook.app.service('users').get(res.userId).then(function(user) {
                hook.result.data = user;
                return Promise.resolve();
              });
            });
          }
        }
      }
    });
  }

  if (options.acceptLegacyTokens) {
    authentication.before({
      create: function(hook) {
        if (hook.data.token) {
          hook.data.strategy = 'jwt',
          hook.data.accessToken = hook.data.token;
          delete hook.data.token;
        }
        if (hook.data.type) {
          hook.data.strategy = hook.data.type;
          delete hook.data.type;
        }
      }
    });
  } 
};

module.exports.Service = Service;
