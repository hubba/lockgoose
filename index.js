const mongoose = require('mongoose');
const LockgooseError = require('./lib/lockgoose.error');
const LockSchema = require('./lib/lock.schema');

/**
 * lockgoose! A mongoose locking library
 *
 * @param {object} mongoose An instance of mongoose
 * @param {object} opts Options { expiry: 60 (seconds), modelName: 'GooseLock' }
 */
module.exports = (opts = {}) => {
    const lockExpiry = opts.expiry || 60;
    const modelName = opts.modelName || 'GooseLock';

    let LockModel;
    let initialised = false;

    /**
     * Initialises the model and ensures indexes
     * Useful when connection is reset (e.g. during testing)
     *
     * @returns {Promise} Resolves when indexes are ensured
     */
    const init = async () => {
        if (!LockModel) {
            LockModel = mongoose.model(modelName, LockSchema(lockExpiry));
        }

        return LockModel.ensureIndexes();
    }

    /**
     * Creates a new lock
     *
     * @param {string} tag An identifier for the lock
     * @returns {object} A lock with unlock() method
     *
     * @throws {Error} If a tag is not provided or is not a string
     */
    const lock = async (tag) => {
        if (!tag || typeof tag !== 'string') {
            throw new LockgooseError('a tag must be provided to identify the lock');
        }

        if (!initialised) {
            await init();
        }

        const newLock = new LockModel({ tag });

        try {
            await newLock.save();
        } catch (err) {
            if ((err.name === 'MongoError' || err.name === 'BulkWriteError') && err.code === 11000) {
                throw new LockgooseError('a lock already exists for this tag');
            }

            throw err;
        }

        return {
            unlock: () => LockModel.remove({ _id: newLock._id })
        };
    };

    /**
     * Unlock a lock matching the given tag
     *
     * @param {string} tag Lock identifier
     * @returns {Promise} Resolves to result of document removal
     *
     * @throws {Error} If a tag is not provided or is not a string
     */
    const unlock = async (tag) => {
        if (!tag || typeof tag !== 'string') {
            throw new LockgooseError('a tag must be provided to identify the lock');
        }

        if (!initialised) {
            await init();
        }

        return LockModel.remove({ tag });
    };

    return {
        init,
        lock,
        unlock
    };
};
