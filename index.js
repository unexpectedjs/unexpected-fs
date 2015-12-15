var mockfs = require('mock-fs');
var fs = require('fs');
var MountFs = require('mountfs');
var rewriteMockFsOptions = require('./lib/rewriteMockFsOptions');

module.exports = {
    name: 'unexpected-fs',
    installInto: function (expect) {
        expect.addAssertion('<any> with fs mocked out <object> <assertion>', function (expect, subject, value) {
            expect.errorMode = 'bubble';
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

                return expect.shift();
            }).finally(function () {
                mockFileSystems.forEach(function (mockFs) {
                    fs.unmount(mockFs.mountPath);
                });
                fs.unpatch();
            });
        });

        expect.addAssertion('<string> to be a (path|text file) satisfying <any>', function (expect, subject, value) {
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

        expect.addAssertion('<string> [not] to be an existing path', function (expect, subject) {
            return expect.promise(function (run) {
                fs.exists(subject, run(function (exists) {
                    return expect(exists, '[not] to be true');
                }));
            });
        });
    }
};
