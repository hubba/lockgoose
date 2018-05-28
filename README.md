# lockgoose

## Install

```bash
npm i lockgoose
```

Requires [http://mongoosejs.com/](mongoose) to be installed as a dependency.

## Usage

```javascript
const lockgoose = require('lockgoose')({ /* options */ });

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
