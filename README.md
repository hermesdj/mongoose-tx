# Mongoose TX

[![Build Status](https://travis-ci.org/hermesdj/mongoose-tx.svg?branch=master)](https://travis-ci.org/hermesdj/mongoose-tx)
[![NPM](https://nodei.co/npm/mongoose-tx.png?compact=true)](https://npmjs.org/package/mongoose-tx)

Mongoose tx is a transaction helper that runs transaction with retry and commit with retry according to the Mongodb 
[documentation](https://docs.mongodb.com/manual/core/transactions/)

### Credits

Took a lot of inspiration from the quite promising mongoose ACID library you can find here :

[Mongoose ACID](https://www.npmjs.com/package/mongoose-acid)

### required

```
nodejs >= 7.6 | mongoose >= 5.2 | mongodb >= 4.0
```

### usage

```javascript
const Tx = require('mongoose-tx');
await Tx( async (session) => {
    await People.findOneAndUpdate({ name: 'Tx' },{ $inc: { balance: 30 } },{ session });
    await Account.findOneAndUpdate({ name: 'Blank'},{ $inc: { balance: -30 } },{ session });
    // ... 
});
const app = new Koa();
app.use(Tx.middleware());
app.use(async (ctx) => {
    await ctx.tx(async (session) => {
      
    });
})
```

### test

```
npm test
```
