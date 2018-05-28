# lockgoose

A simple library for creating locks with mongoose.

## Install

```bash
npm i lockgoose
```

Requires [mongoose](http://mongoosejs.com/) `^5.0.0` to be installed as a dependency.

## Usage

```javascript
const lockgoose = require('lockgoose');

// (initialise your mongoose connection here)

// initialise lockgoose
await lockgoose.init({ /* options */ });

// create a lock
const lock = await lockgoose.lock('tag');

// unlock a lock in-scope
await lock.unlock();

// unlock a lock created earlier
await lockgoose.unlock('tag');

// reinit index on locks (useful if you are dropping database during testing)
await lockgoose.init();
```

## Test

Testing provided by [Jest](https://facebook.github.io/jest/) and linting by [eslint](https://eslint.org/).

```javascript
npm test
npm run test:lint
```
