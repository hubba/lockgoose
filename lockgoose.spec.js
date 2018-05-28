const MongoDBMemoryServer = require('mongodb-memory-server');
const mongoose = require('mongoose');
const lockgoose = require('./index')();

// set long timeout so that mongo binary can download
jest.setTimeout(30000);

const mongoServer = new MongoDBMemoryServer.default();

beforeAll(async () => {
    await mongoose.connect(
        await mongoServer.getConnectionString()
    );
});

describe('lockgoose test suite', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        await mongoose.connection.db.dropDatabase();

        return lockgoose.init();
    });

    it('can be re-required without failing', () => {
        require('./index')();
    });

    describe('lock()', () => {
        it('creates a new lock', async () => {
            const lock = await lockgoose.lock('testlock');

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
                await lockgoose.lock('testlock');
                await lockgoose.lock('testlock');
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.name).toEqual('LockgooseError');
                expect(err.message).toBe('a lock already exists for this tag');
            }
        });

        it('throws an error if no tag is passed', async () => {
            try {
                await lockgoose.unlock();
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.name).toEqual('LockgooseError');
                expect(err.message).toEqual('a tag must be provided to identify the lock');
            }
        });

        it('handles BulkWriteErrors from older mongoose versions', async () => {
            expect.assertions(3);

            jest.spyOn(mongoose.Model.prototype, 'save')
            .mockImplementationOnce(() => {
                const err = new Error();

                err.name = 'BulkWriteError';
                err.code = 11000;

                throw err;
            });

            try {
                await lockgoose.lock('testlock');
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.name).toEqual('LockgooseError');
                expect(err.message).toBe('a lock already exists for this tag');
            }
        });
    });

    describe('unlock()', () => {
        it('unlocks a previously created lock', async () => {
            await lockgoose.lock('testlock');

            expect(await mongoose.model('GooseLock').count()).toBe(1);

            await lockgoose.unlock('testlock');

            expect(await mongoose.model('GooseLock').count()).toBe(0);
        });

        it('has no effect if no lock is found with the given tag', async () => {
            await lockgoose.unlock('testlock');
        });

        it('throws an error if no tag is passed', async () => {
            try {
                await lockgoose.unlock();
            } catch (err) {
                expect(err).toBeDefined();
                expect(err.name).toEqual('LockgooseError');
                expect(err.message).toEqual('a tag must be provided to identify the lock');
            }
        });
    });

    describe('lock.unlock()', () => {
        it('unlocks a lock which exists in scope', async () => {
            const lock = await lockgoose.lock('testlock');

            await lock.unlock();

            expect(await mongoose.model('GooseLock').count()).toBe(0);
        });

        it('has no effect when no lock is found with the given tag', async () => {
            const lock = await lockgoose.lock('testlock');

            await lock.unlock();
            await lock.unlock();

            expect(await mongoose.model('GooseLock').count()).toBe(0);
        });
    });
});

afterAll(async () => {
    return mongoServer.stop();
});
