const MongoDBMemoryServer = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Locks = require('../index')(mongoose);

// set long timeout so that mongo binary can download
jest.setTimeout(30000);

const mongoServer = new MongoDBMemoryServer.default();

beforeAll(async () => {
    await mongoose.connect(
        await mongoServer.getConnectionString()
    );
});

describe('hubba-locks test suite', () => {
    beforeEach(async () => {
        await mongoose.model('HubbaLock').remove();
    });

    describe('lock()', () => {
        it('creates a new lock', async () => {
            const lock = await Locks.lock('testlock');

            expect(lock.unlock).toEqual(expect.any(Function));

            const lockDocs = await mongoose.model('HubbaLock').find();
            const currentDate = new Date();

            expect(lockDocs.length).toEqual(1);
            expect(lockDocs[0].tag).toEqual('testlock');
            expect(lockDocs[0].createdAt.getHours()).toEqual(currentDate.getHours());
            expect(lockDocs[0].createdAt.getMinutes()).toEqual(currentDate.getMinutes());
        });

        it('prevents a duplicate lock being obtained', async () => {
            expect.assertions(3);

            try {
                await Locks.lock('testlock');
                await Locks.lock('testlock');
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.name).toEqual('MongoError');
                expect(err.code).toBe(11000);
            }
        });
    });

    describe('Lock.unlock()', () => {
        it('unlocks an existing lock', async () => {
            const lock = await Locks.lock('testlock');

            await lock.unlock();

            expect(await mongoose.model('HubbaLock').count()).toBe(0);
        });

        it('handles when no lock is found with the given tag', async () => {
            const lock = await Locks.lock('testlock');

            await lock.unlock();
            await lock.unlock();

            expect(await mongoose.model('HubbaLock').count()).toBe(0);
        });
    });
});

afterAll(async () => {
    return mongoServer.stop();
});
