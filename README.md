# lockgoose

## Install

```bash
npm i lockgoose
```

## Usage

```javascript
const mongoose = require('mongoose');
const lockgoose = require('lockgoose')(mongoose);

// (initialise your mongoose connection here)

// create a lock
const lock = await lockgoose.lock('tag');

// unlock a lock in-scope
await lock.unlock();

// unlock a lock created earlier
await lockgoose.unlock('tag');
```

### Test

```javascript
npm test
npm run test:lint
```
