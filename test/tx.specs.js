const mongoose = require('mongoose');
mongoose.set('debug', false);
const Tx = require('../src/tx');
const chai = require('chai');
const expect = chai.expect;
const {MongoMemoryReplSet} = require('mongodb-memory-server');

const wait = (t) => new Promise(res => setTimeout(res, t));

const Account = mongoose.model('Account', new mongoose.Schema({
    balance: Number
}));
const People = mongoose.model('People', new mongoose.Schema({
    name: String,
    balance: Number
}));

let uri;
let conn;
let replSet;

const initReplSet = async function () {
    replSet = new MongoMemoryReplSet({
        debug: process.env.DEBUG === '*',
        instanceOpts: [
            {
                storageEngine: 'wiredTiger'
            }
        ],
        replSet: {
            name: 'rs',
            oplogSize: 5,
            configSettings: {
                electionTimeoutMillis: 500,
            },
        }
    });

    await replSet.waitUntilRunning();
    await wait(2000);

    uri = `${await replSet.getConnectionString()}?replicaSet=rs`;
};

describe('mongoose-tx', function () {
    this.timeout(60000);

    before(async function () {
        if (!uri) await initReplSet();
        conn = await mongoose.connect(uri, {
            useNewUrlParser: true
        });
        await Account.deleteMany();
        await People.deleteMany();
        await Account.create({balance: 100});
        await People.create({name: 'Tx', balance: 0});
    });

    after(async function () {
        await Account.deleteMany();
        await People.deleteMany();
        await mongoose.connection.db.dropDatabase();
        await conn.disconnect();
    });

    it('should run a transaction', async function () {
        try {
            await Tx(async (session) => {
                await People.findOneAndUpdate(
                    {name: 'Tx'},
                    {$inc: {balance: 30}},
                    {new: true, session});
                await Account.findOneAndUpdate(
                    {},
                    {$inc: {balance: -30}},
                    {new: true, session});
            })
        } catch (error) {
        }
        let people = await People.findOne();
        let account = await Account.findOne();
        expect(people.balance).to.be.equal(30);
        expect(account.balance).to.be.equal(100 - 30);
    });

    it('should fail with an error', async function () {
        try {
            await Tx(async (session) => {
                await People.findOneAndUpdate(
                    {name: 'Tx'},
                    {$inc: {balance: 30}},
                    {new: true, session});

                await Account.findOneAndUpdate(
                    {},
                    {$inc: {balance: -30}},
                    {new: true, session});

                throw new Error('User Error')
            })
        } catch (error) {

        }
        let people = await People.findOne();
        let account = await Account.findOne();
        expect(people.balance).to.be.equal(30);
        expect(account.balance).to.be.equal(100 - 30);
    });
});