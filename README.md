# feathers-authentication-compability

This module keeps the old client libraries using auth local and socket.io compatible with auk style login.

## Usage

```javascript
const authenticationCompability = require('feathers-authentication-compability');
// after app.configure(authentication);
app.configure(authenticationCompability);
