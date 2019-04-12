const mongoose = require('mongoose');
const os = require('os');
const hostname = os.hostname();
mongoose.set('debug', false);
const Tx = require('../src/tx');
const chai = require('chai');
const expect = chai.expect;
const uri = os.platform() === 'win32' ? `mongodb://${hostname}:27017,${hostname}:27018,${hostname}:27019/test` : 'mongodb://localhost:27017,localhost:27018,localhost:27019/test';
const Account = mongoose.model('Account', new mongoose.Schema({
    balance: Number
}));
const People = mongoose.model('People', new mongoose.Schema({
    name: String,
    balance: Number
}));

let conn;

describe('mongoose-tx', function () {
    this.timeout(10000);

    before(async function () {
        conn = await mongoose.connect(uri, {
            replicaSet: 'rs',
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