const mongoose = require('mongoose');
const LockgooseError = require('./lib/lockgoose.error');
const LockSchema = require('./lib/lock.schema');

/**
 * lockgoose! A mongoose locking library
 */
class Lockgoose {
    constructor() {
        this.initialised = false;
        this.lockExpiry = 60;
        this.modelName = 'GooseLock';
    }

    /**
     * Initialises the model and ensures indexes
     * Useful when connection is reset (e.g. during testing)
     *
     * @param {object} opts Options { expiry: 60 (seconds), modelName: 'GooseLock' }
     * @returns {Promise} Resolves when indexes are ensured
     */
    async init(opts = {}) {
        if (!this.LockModel) {
            this.LockModel = mongoose.model(
                opts.modelName || this.modelName,
                LockSchema(opts.expiry || this.lockExpiry)
            );
        }

        return this.LockModel.ensureIndexes();
    }

    /**
     * Creates a new lock
     *
     * @param {string} tag An identifier for the lock
     * @returns {object} A lock with unlock() method
     *
     * @throws {Error} If a tag is not provided or is not a string
     */
    async lock(tag) {
        if (!tag || typeof tag !== 'string') {
            throw new LockgooseError('a tag must be provided to identify the lock');
        }

        if (!this.initialised) {
            await this.init();
        }

        const newLock = new this.LockModel({ tag });

        try {
            await newLock.save();
        } catch (err) {
            if ((err.name === 'MongoError' || err.name === 'BulkWriteError') && err.code === 11000) {
                throw new LockgooseError('a lock already exists for this tag');
            }

            throw err;
        }

        return {
            unlock: () => this.LockModel.remove({ _id: newLock._id })
        };
    }

    /**
     * Unlock a lock matching the given tag
     *
     * @param {string} tag Lock identifier
     * @returns {Promise} Resolves to result of document removal
     *
     * @throws {Error} If a tag is not provided or is not a string
     */
    async unlock(tag) {
        if (!tag || typeof tag !== 'string') {
            throw new LockgooseError('a tag must be provided to identify the lock');
        }

        if (!this.initialised) {
            await this.init();
        }

        return this.LockModel.remove({ tag });
    }
}

module.exports = new Lockgoose();
