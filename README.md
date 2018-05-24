# simple-mongo-locks

## Install

```bash
npm i lockgoose
```

## Usage

```javascript
const mongoose = require('mongoose');
const LockGoose = require('lockgoose')(mongoose);

// (initialise your mongoose connection here)

// create a lock
const lock = await LockGoose.lock('tag');

// unlock a lock in-scope
await lock.unlock();

// unlock a lock created earlier
await LockGoose.unlock('tag');
```

### Test

```javascript
npm test
npm run test:lint
```
