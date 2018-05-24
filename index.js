module.exports = (mongoose, opts = {}) => {
    if (!mongoose || !mongoose.Schema || !mongoose.model) {
        throw new Error('an instance of mongoose must be passed when requiring the library');
    }

    const LOCK_EXPIRY = 60;

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
    });

    const LockModel = mongoose.model('HubbaLock', LockSchema);

    let initialised = false;

    const lock = async (tag) => {
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

    return {
        lock
    };
};
