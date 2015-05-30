var unexpected = require('unexpected');
var unexpectedFs = require('../');

describe('unexpected-fs', function () {
    describe('with a filesystem like', function () {
        var fileContent = function (fileName) {
            var fs = require('fs');

            return fs.readFileSync('/' + fileName, 'utf-8');
        }

        var expect = unexpected
            .clone()
            .installPlugin(unexpectedFs);

        it('should not throw', function () {
            return expect('foobar.txt', 'with a filesystem like', {
                '/foobar.txt': 'Foobar!'
            }, 'when passed as parameter to', fileContent, 'to equal', 'Foobar');
        });
    });
});