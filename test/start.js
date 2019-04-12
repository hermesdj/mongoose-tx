process.env.DEBUG = 'mongoose-tx';

const Mocha = require('mocha'),
    path = require('path'),
    glob = require('glob');

// Instantiate a Mocha instance.
const mocha = new Mocha({
    timeout: 60000
});

// Add each .js file to the mocha instance
glob.sync(path.join(__dirname, '/**/*.specs.js'))
    .forEach(function (file) {
        mocha.addFile(
            file
        );
    });

// Init the database
mocha.run(function (failures) {
    process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
});