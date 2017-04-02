# feathers-authentication-compatibility

This module keeps the old client libraries `0.x` using auth local and socket.io compatible with auk style login `1.0+`.

## Usage

    npm install feathers-authentication-compatibility

```javascript
const authenticationCompatibility = require('feathers-authentication-compatibility');
// after app.configure(authentication);
app.configure(authenticationCompatibility);
