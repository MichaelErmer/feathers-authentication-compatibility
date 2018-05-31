// Initializes the `users` service on path `/users`
const createService = require('feathers-nedb');
const createModel = require('../../models/users.model');
const hooks = require('./users.hooks');
const filters = require('./users.filters');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'users',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/users', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('users');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }

  setTimeout(function () {
    console.log('Checking if users exist.');
    service.find({}).then(result => {
      if (result.total === 0 && app.get('initialUser')) {
        service.create(app.get('initialUser'))
          .then(result => {
            console.log('Initial user created:', result);
          })
          .catch(error => {
            console.error(error);
          });
      }
    });
  }, 100);
};
