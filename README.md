# Mongoose TX

[![NPM](https://nodei.co/npm/mongoose-tx.png?compact=true)](https://npmjs.org/package/mongoose-tx)

Mongoose tx is a transaction helper that runs transaction with retry and commit with retry according to the Mongodb 
[documentation](https://docs.mongodb.com/manual/core/transactions/)

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