var mockfs = require('mock-fs');
var rewriteMockFsOptions = require('./lib/rewriteMockFsOptions');

module.exports = {
    name: 'unexpected-fs',
    installInto: function (expect) {
        expect.addAssertion('with fs mocked out', function (expect, subject, value) {
            this.errorMode = 'bubble';
            var extraArgs = Array.prototype.slice.call(arguments, 3);
            var mockOptions = rewriteMockFsOptions(value);
            return expect.promise(function (resolve, reject) {
                mockfs(mockOptions);
                return resolve(expect.apply(expect, [subject].concat(extraArgs)));
            }).then(function () {
                mockfs.restore();
            }).caught(function (err) {
                mockfs.restore();
                throw err;
            });
        });
    }
};
