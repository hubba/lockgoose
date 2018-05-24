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
        }
    });

    const LockModel = mongoose.model('HubbaLock', LockSchema);

    const lock = async (tag) => {
        const newLock = await LockModel.create({}); // TODO: tag

        return {
            unlock: () => LockModel.remove({ _id: newLock._id })
        };
    };

    return {
        lock
    };
};
