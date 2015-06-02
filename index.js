var mockfs = require('mock-fs');
var fs = require('fs');
var MountFs = require('mountfs');
var rewriteMockFsOptions = require('./lib/rewriteMockFsOptions');

module.exports = {
    name: 'unexpected-fs',
    installInto: function (expect) {
        expect.addAssertion('with fs mocked out', function (expect, subject, value) {
            this.errorMode = 'bubble';
            var extraArgs = Array.prototype.slice.call(arguments, 3);

            var mockFileSystems = Object.keys(value).map(function (key) {
                var mockFsConfig = rewriteMockFsOptions(value[key]);
                return {
                    mountPath: /\/$/.test(key) ? key : key + '/',
                    fileSystem: mockfs.fs(mockFsConfig)
                };
            });

            var unmountAllMocks = function () {
                mockFileSystems.forEach(function (mockFs) {
                    fs.unmount(mockFs.mountPath);
                });
                fs.unpatch();
            };

            return expect.promise(function () {
                MountFs.patchInPlace();

                mockFileSystems.forEach(function (mockFileSystem) {
                    fs.mount(mockFileSystem.mountPath, mockFileSystem.fileSystem);
                });

                return expect.apply(expect, [subject].concat(extraArgs));
            }).then(function () {
                unmountAllMocks();
            }).caught(function (err) {
                unmountAllMocks();
                throw err;
            });
        });
    }
};
