'use strict';

const hooks = require('./hooks');

class Service {
  constructor(options) {
    this.options = options || {};
  }
  
  setup(app) {
    this.app = app;
  }

  create(data, params) {
    return this.app.service('authentication').create(data, params);
  }
}

module.exports = function(options){
  const app = this;
  const options = options || {
    path: '/auth/local'
  };

  // Initialize our service with any options it requires
  app.use(options.path, new Service());

  // Get our initialize service to that we can bind hooks
  const authenticationCompabilityService = app.service(options.path);

  // Set up our before hooks
  authenticationCompabilityService.before(hooks.before);

  // Set up our after hooks
  authenticationCompabilityService.after(hooks.after);
};

module.exports.Service = Service;
