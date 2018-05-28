/**
 * lockgoose error class
 */
class LockgooseError extends Error {
    constructor(...args) {
        super(...args);

        this.name = 'LockgooseError';

        Error.captureStackTrace(this, LockgooseError);
    }
}

module.exports = LockgooseError;
