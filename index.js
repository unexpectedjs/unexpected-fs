var mockfs = require('mock-fs');

module.exports = {
    name: 'unexpected-fs',
    installInto: function (expect) {
        expect.addAssertion('with a filesystem like', function (expect, subject, value) {
            this.errorMode = 'bubble';
            var extraArgs = Array.prototype.slice.call(arguments, 3);
            return expect.promise(function (resolve, reject) {
                mockfs(value);

                return resolve(expect.apply(expect, [subject].concat(extraArgs)));
            }).then(function () {
                // When is this executed?
                //mockfs.restore();
            });
        });
    }
};