/**
 * lockgoose! A mongoose locking library
 *
 * @param {object} mongoose An instance of mongoose
 * @param {object} opts Options { expiry: 60, modelName: 'GooseLock' }
 */
module.exports = (mongoose, opts = {}) => {
    if (!mongoose || !mongoose.Schema || !mongoose.model) {
        throw new Error('an instance of mongoose must be passed when requiring the library');
    }

    const LOCK_EXPIRY = 60;
    const MODEL_NAME = 'GooseLock';

    const LockSchema = new mongoose.Schema({
        createdAt: {
            default: Date.now,
            expires: opts.expiry || LOCK_EXPIRY,
            required: true,
            type: Date
        },
        tag: {
            index: true,
            required: true,
            type: String,
            unique: true
        }
    }, {
        read: 'linearizable'
    });

    const LockModel = mongoose.model(opts.modelName || MODEL_NAME, LockSchema);

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
            throw new Error('a tag must be provided to identify the lock');
        }

        if (!initialised) {
            await LockModel.ensureIndexes();

            initialised = true;
        }

        const newLock = new LockModel({ tag });

        await newLock.save();

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
            throw new Error('a tag must be provided to identify the lock');
        }

        return LockModel.remove({ tag });
    };

    return {
        lock,
        unlock
    };
};
