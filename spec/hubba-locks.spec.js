const MongoDBMemoryServer = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Locks = require('../index')(mongoose);

// set long timeout so that mongo binary can download
jest.setTimeout(30000);

const mongoServer = new MongoDBMemoryServer.default();

beforeAll(async () => {
    return mongoose.connect(
        await mongoServer.getConnectionString()
    );
});

describe('hubba-locks test suite', () => {
    beforeEach(() => {
        return mongoose.model('HubbaLock').remove();
    });

    describe('lock()', () => {
        it('creates a new lock', async () => {
            const lock = await Locks.lock();

            expect(lock.unlock).toEqual(expect.any(Function));

            const lockDocs = await mongoose.model('HubbaLock').find();
            const currentDate = new Date();

            expect(lockDocs.length).toEqual(1);
            expect(lockDocs[0].createdAt.getHours()).toEqual(currentDate.getHours());
            expect(lockDocs[0].createdAt.getMinutes()).toEqual(currentDate.getMinutes());
        });
    });

    describe('Lock.unlock()', () => {
        it('unlocks an existing lock', async () => {
            const lock = await Locks.lock();

            await lock.unlock();

            expect(await mongoose.model('HubbaLock').count()).toBe(0);
        });
    });
});

afterAll(async () => {
    return mongoServer.stop();
});
