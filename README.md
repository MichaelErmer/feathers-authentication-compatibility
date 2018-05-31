# feathers-authentication-compatibility

This module keeps the old client libraries `0.x` using auth local and socket.io compatible with auk style login `1.0+`.

## Usage

    npm install feathers-authentication-compatibility

### legacy endpoint /auth/local

```javascript
const authenticationCompatibility = require('feathers-authentication-compatibility');
// after app.configure(authentication);
app.configure(authenticationCompatibility({ options }));
```

Defaults for `options` are:

* path: '/authentication',
* legacyPath: '/auth/local',
* socket: true,

### legacy client request syntax

```javascript
const authenticationCompatibility = require('feathers-authentication-compatibility');

app.service('authentication').hooks({
  before: {
    create: [
      authenticationCompatibility.beforeAuthenticationCreateHook()
    ]
  }
});
```

### send user and *token* in response

```javascript
const authenticationCompatibility = require('feathers-authentication-compatibility');

app.service('authentication').hooks({
  after: {
    create: [
      authenticationCompatibility.afterAuthenticationReturnLegacyTokenHook(),
      authenticationCompatibility.afterAuthenticationReturnUserHook()
    ]
  }
});
```