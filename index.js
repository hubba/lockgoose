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

    const LockModel = mongoose.model(modelName, LockSchema(lockExpiry));

    let initialised = false;

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
            await LockModel.ensureIndexes();

            initialised = true;
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
    const unlock = (tag) => {
        if (!tag || typeof tag !== 'string') {
            throw new LockgooseError('a tag must be provided to identify the lock');
        }

        return LockModel.remove({ tag });
    };

    return {
        lock,
        unlock
    };
};
