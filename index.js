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

            return expect.promise(function () {
                MountFs.patchInPlace();

                mockFileSystems.forEach(function (mockFileSystem) {
                    fs.mount(mockFileSystem.mountPath, mockFileSystem.fileSystem);
                });

                return expect.apply(expect, [subject].concat(extraArgs));
            }).finally(function () {
                mockFileSystems.forEach(function (mockFs) {
                    fs.unmount(mockFs.mountPath);
                });
                fs.unpatch();
            });
        });

        expect.addAssertion('to be a (path|text file) satisfying', function (expect, subject, value) {
            var alternations = this.alternations;
            return expect.promise(function (run) {
                fs.lstat(subject, run(function (err, stats) {
                    if (err) {
                        throw err;
                    }
                    ['isDirectory', 'isSymbolicLink', 'isFile', 'isBlockDevice', 'isCharacterDevice', 'isFIFO', 'isSocket'].forEach(function (methodName) {
                        stats[methodName] = stats[methodName]();
                    });
                    if (stats.isFile || stats.isSymlink) {
                        fs.readFile(subject, run(function (err, content) {
                            if (err) {
                                throw err;
                            }
                            if (alternations[0] === 'text file') {
                                content = content.toString('utf-8');
                            }
                            stats.content = content;
                            return expect(stats, 'to satisfy', value);
                        }));
                    } else {
                        if (alternations[0] === 'text file') {
                            expect.fail('expected directory to be a text file');
                        }
                        return expect(stats, 'to satisfy', value);
                    }
                }));
            });
        });
    }
};
