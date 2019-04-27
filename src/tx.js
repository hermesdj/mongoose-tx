const debug = require('debug')('mongoose-tx');
const mongoose = require('mongoose');

/**
 * Commit a transaction and retry it if failed with error UnknownTransactionCommitResult
 * @param session
 * @returns {Promise<void>}
 */
async function commitWithRetry(session) {
    try {
        await session.commitTransaction();
        debug('Transaction committed.');
    } catch (error) {
        if (
            error.errorLabels &&
            error.errorLabels.indexOf('UnknownTransactionCommitResult') >= 0
        ) {
            debug('UnknownTransactionCommitResult, retrying commit operation ...');
            await commitWithRetry(session);
        } else {
            debug('Error during commit ...');
            throw error;
        }
    }
}

/**
 * run the transaction and retry it if the error is a TransientTransactionError
 * @param txnFunc
 * @param session
 * @returns {Promise<void>}
 */
async function runTransactionWithRetry(txnFunc, session) {
    try {
        await txnFunc(session);
    } catch (error) {
        debug('Transaction aborted. Caught exception during transaction.');

        // If transient error, retry the whole transaction
        if (error.errorLabels && error.errorLabels.indexOf('TransientTransactionError') >= 0) {
            debug('TransientTransactionError, retrying transaction ...');
            await runTransactionWithRetry(txnFunc, session);
        } else {
            throw error;
        }
    }
}

/**
 * Run a transaction. The wrapper is a function that accepts the session as parameter
 * @param wrapper
 * @returns {Promise<void>}
 * @constructor
 */
async function Tx(wrapper) {
    const session = await mongoose.startSession();
    session.startTransaction();
    debug('transaction start');
    try {
        await runTransactionWithRetry(wrapper, session);
        await commitWithRetry(session);
        debug('transaction successful');
    } catch (err) {
        debug('transaction failure with error %o', err);
        await session.abortTransaction();
        throw err
    } finally {
        debug('transaction end');
        session.endSession();
    }
}

/**
 * Middleware usable in expressjs for convenience
 * @returns {Function}
 */
Tx.middleware = () => {
    return async (ctx, next) => {
        ctx.tx = Tx;
        await next();
    }
};

module.exports = Tx;