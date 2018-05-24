const MongoDBMemoryServer = require('mongodb-memory-server');
const mongoose = require('mongoose');
const LockGoose = require('./index')(mongoose);

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
        await mongoose.model('GooseLock').remove();
    });

    describe('lock()', () => {
        it('creates a new lock', async () => {
            const lock = await LockGoose.lock('testlock');

            expect(lock.unlock).toEqual(expect.any(Function));

            const lockDocs = await mongoose.model('GooseLock').find();
            const currentDate = new Date();

            expect(lockDocs.length).toEqual(1);
            expect(lockDocs[0].tag).toEqual('testlock');
            expect(lockDocs[0].createdAt.getHours()).toEqual(currentDate.getHours());
            expect(lockDocs[0].createdAt.getMinutes()).toEqual(currentDate.getMinutes());
        });

        it('prevents a duplicate lock being obtained', async () => {
            expect.assertions(3);

            try {
                await LockGoose.lock('testlock');
                await LockGoose.lock('testlock');
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.name).toEqual('MongoError');
                expect(err.code).toBe(11000);
            }
        });

        it('throws an error if no tag is passed', async () => {
            try {
                await LockGoose.unlock();
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.message).toEqual('a tag must be provided to identify the lock');
            }
        });
    });

    describe('unlock()', () => {
        it('unlocks a previously created lock', async () => {
            await LockGoose.lock('testlock');

            expect(await mongoose.model('GooseLock').count()).toBe(1);

            await LockGoose.unlock('testlock');

            expect(await mongoose.model('GooseLock').count()).toBe(0);
        });

        it('has no effect if no lock is found with the given tag', async () => {
            await LockGoose.unlock('testlock');
        });

        it('throws an error if no tag is passed', async () => {
            try {
                await LockGoose.unlock();
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.message).toEqual('a tag must be provided to identify the lock');
            }
        });
    });

    describe('lock.unlock()', () => {
        it('unlocks a lock which exists in scope', async () => {
            const lock = await LockGoose.lock('testlock');

            await lock.unlock();

            expect(await mongoose.model('GooseLock').count()).toBe(0);
        });

        it('has no effect when no lock is found with the given tag', async () => {
            const lock = await LockGoose.lock('testlock');

            await lock.unlock();
            await lock.unlock();

            expect(await mongoose.model('GooseLock').count()).toBe(0);
        });
    });
});

afterAll(async () => {
    return mongoServer.stop();
});
