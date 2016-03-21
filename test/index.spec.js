var fs = require('fs');
var path = require('path');
var expect = require('unexpected')
    .clone()
    .installPlugin(require('../index'));

describe('unexpected-fs', function () {
    describe('with fs mocked out', function () {
        var fileContent = function (fileName) {
            return fs.readFileSync('/data/' + fileName, 'utf-8');
        };

        it('should not throw', function () {
            return expect('foobar.txt', 'with fs mocked out', {
                '/data/': {
                    '/foobar.txt': 'Foobar!'
                }
            }, 'when passed as parameter to', fileContent, 'to equal', 'Foobar!');
        });

        it('should list the mounted directory in the parent', function () {
            return expect(function () {
                expect(fs.readdirSync('/foo/bar/'), 'to contain', 'quux');
            }, 'with fs mocked out', {
                '/foo/bar/quux/': {}
            }, 'not to error');
        });

        it('should mount a directory on /data even if the trailing / is missing', function () {
            return expect('foobar.txt', 'with fs mocked out', {
                '/data': {
                    '/foobar.txt': 'Foobar!'
                }
            }, 'when passed as parameter to', fileContent, 'to equal', 'Foobar!');
        });

        it('should consider relative paths on first level in mock fs to be relative to the mountPath', function () {
            return expect('foobar.txt', 'with fs mocked out', {
                '/data': {
                    'foobar.txt': 'Foobar!'
                }
            }, 'when passed as parameter to', fileContent, 'to equal', 'Foobar!');
        });

        describe('mock.file proxy', function () {
            it('should realise that an object is a file', function () {
                return expect('/foo.txt', 'with fs mocked out', {
                    '/': {
                        '/foo.txt': {
                            _isFile: true,
                            ctime: new Date(1),
                            content: 'foobar!'
                        }
                    }
                }, 'to be a text file satisfying', {
                    content: 'foobar!',
                    ctime: new Date(1),
                    isFile: true
                });
            });
        });
        describe('mock.symlink proxy', function () {
            it('should realise that an object is a symlink', function () {
                return expect(function () {
                    return expect.promise(function (run) {
                        fs.readFile('/bar.txt', 'utf-8', run(function (err, data) {
                            expect(data, 'to satisfy', 'Foobar!');
                        }));
                    });
                }, 'with fs mocked out', {
                    '/': {
                        'foo.txt': 'Foobar!',
                        'bar.txt': {
                            _isSymlink: true,
                            path: 'foo.txt'
                        }
                    }
                }, 'not to error');
            });
        });
        it('should allow reading files on the normal fs', function () {
            return expect(function () {
                var packageJsonPath = path.resolve(__dirname, '..', 'package.json');
                fs.readFileSync(packageJsonPath, 'utf-8');
            }, 'with fs mocked out', {}, 'not to throw');
        });
        it('should allow reading files on different mounted mock fs', function () {
            var mockFs = {};
            mockFs[path.resolve(__dirname, 'wtf') + '/'] = {
                '/FUNNYSTORY.md': 'lol, just kidding.'
            };
            mockFs[path.resolve(__dirname, 'lol') + '/'] = {
                '/SADSTORY.md': 'wtf, just kidding?'
            };
            return expect(function () {
                var funnyStoryPath = path.resolve(__dirname, 'wtf', 'FUNNYSTORY.md');
                var funnyStory = fs.readFileSync(funnyStoryPath, 'utf-8');
                expect(funnyStory, 'to equal', 'lol, just kidding.');
                var sadStoryPath = path.resolve(__dirname, 'lol', 'SADSTORY.md');
                var sadStory = fs.readFileSync(sadStoryPath, 'utf-8');
                expect(sadStory, 'to equal', 'wtf, just kidding?');
            }, 'with fs mocked out', mockFs, 'not to throw');
        });
        it('should allow reading both files on the real fs and the mocked out one', function () {
            var mockFs = {};
            mockFs[path.resolve(__dirname, 'wtf') + '/'] = {
                '/FUNNYSTORY.md': 'lol, just kidding.'
            };
            mockFs[path.resolve(__dirname, 'lol') + '/'] = {
                '/SADSTORY.md': 'wtf, just kidding?'
            };
            return expect(function () {
                var packageJsonPath = path.resolve(__dirname, '..', 'package.json');
                var packageJson = fs.readFileSync(packageJsonPath, 'utf-8');
                expect(packageJson, 'to match', /^{\s+"name":\s"unexpected-fs",/);
                var funnyStoryPath = path.resolve(__dirname, 'wtf', 'FUNNYSTORY.md');
                var funnyStory = fs.readFileSync(funnyStoryPath, 'utf-8');
                expect(funnyStory, 'to equal', 'lol, just kidding.');
                var sadStoryPath = path.resolve(__dirname, 'lol', 'SADSTORY.md');
                var sadStory = fs.readFileSync(sadStoryPath, 'utf-8');
                expect(sadStory, 'to equal', 'wtf, just kidding?');
            }, 'with fs mocked out', mockFs, 'not to throw');
        });
    });

    describe('fs.readdir', function () {
        it('should list only the files specified in mocked fs', function () {
            return expect(function (cb) {
                fs.readdir('/fixtures/migrations/', cb);
            }, 'with fs mocked out', {
                '/fixtures': {
                    'migrations': {
                        'foo.txt': 'foobar'
                    }
                }
            }, 'to call the callback without error').spread(function (files) {
                return expect(files, 'to satisfy', [
                    'foo.txt'
                ]);
            });
        });
        it('should be able to list files without a trailing slash', function () {
            return expect(function (cb) {
                fs.readdir('/fixtures/migrations', cb);
            }, 'with fs mocked out', {
                '/fixtures/migrations': {
                    'foo.txt': 'foobar'
                }
            }, 'to call the callback without error');
        });
        it('should list files in root', function () {
            return expect(function (cb) {
                fs.readdir('/', cb);
            }, 'with fs mocked out', {
                '/': {
                    'foo.txt': 'foobar'
                }
            }, 'to call the callback without error').spread(function (files) {
                return expect(files, 'to contain', 'foo.txt');
            });
        });
        it('should list only the files specified in mocked fs when in root', function () {
            return expect(function (cb) {
                fs.readdir('/foo/', cb);
            }, 'with fs mocked out', {
                '/foo': {
                    'foobar.txt': 'foobar'
                }
            }, 'to call the callback without error').spread(function (files) {
                return expect(files, 'to satisfy', [
                    'foobar.txt'
                ]);
            });
        });
    });

    describe('fs.link', function () {
        it('should support creating a hard link to an existing file', function () {
            return expect(function () {
                return expect.promise(function (run) {
                    fs.link('/fixtures/migrations/foo.txt', '/fixtures/migrations/bar.txt', run(function (err) {
                        expect(err, 'to be falsy');
                        fs.readdir('/fixtures/migrations/', run(function (err, entries) {
                            expect(err, 'to be falsy');
                            expect(entries, 'to equal', [ 'bar.txt', 'foo.txt' ]);
                        }));
                    }));
                });
            }, 'with fs mocked out', {
                '/fixtures': {
                    'migrations': {
                        'foo.txt': 'foobar'
                    }
                }
            }, 'not to error');
        });
    });

    describe('does it update already exisitng fs modules?', function () {
        it('huh?', function () {
            var someMethod = function (fileName) {
                return fs.readFileSync('/' + fileName, 'utf-8');
            };

            return expect('doesIt.txt', 'with fs mocked out', {
                '/': {
                    '/doesIt.txt': 'Yes it does!'
                }
            }, 'when passed as parameter to', someMethod, 'to equal', 'Yes it does!');
        });
    });

    it('should unpatch fs even when the subsequent assertion fails', function () {
        expect(function () {
            return expect('/highlyUnlikely/foobar.txt', 'with fs mocked out', { '/highlyUnlikely': { 'foobar.txt': 'hey'} }, 'when passed as parameter to', function (fileName) {
                return fs.readFileSync(fileName, 'utf-8');
            }, 'to equal', 'goodbye');
        }, 'to throw',
            "expected '/highlyUnlikely/foobar.txt' when passed as parameter to\n" +
            "function (fileName) {\n" +
            "  return fs.readFileSync(fileName, 'utf-8');\n" +
            "} to equal 'goodbye'\n" +
            "  expected 'hey' to equal 'goodbye'\n" +
            "\n" +
            "  -hey\n" +
            "  +goodbye"
        );
        expect(function () {
            fs.readFileSync('/highlyUnlikely/foobar.txt');
        }, 'to throw', /ENOENT(,|:) no such file or directory(, open)? '\/highlyUnlikely\/foobar.txt'/);
    });

    describe('to be an existing path', function () {
        var existingPath = path.resolve(__dirname, '..', 'test', 'a-path-created-for-testing');

        before(function () {
            fs.mkdirSync(existingPath);
        });

        after(function () {
            fs.rmdirSync(existingPath);
        });

        it('should reject the promise if a path does not exist on disk', function () {
            expect.output.preferredWidth = 80;
            return expect(expect('/i/am/certain/this/path/is/highly/unlikely/to/exist', 'to be an existing path'),
                'to be rejected with', 'expected \'/i/am/certain/this/path/is/highly/unlikely/to/exist\'\nto be an existing path');
        });

        it('should fulfil the promise if a path does exist on disk', function () {
            return expect(expect(existingPath, 'to be an existing path'), 'to be fulfilled');
        });
    });

    describe('not to be an existing path', function () {
        var existingPath = path.resolve(__dirname, '..', 'test', 'a-path-created-for-testing');

        before(function () {
            fs.mkdirSync(existingPath);
        });

        after(function () {
            fs.rmdirSync(existingPath);
        });

        it('should fulfil the promise if a path does not exist on disk', function () {
            return expect(expect('/i/am/certain/this/path/is/highly/unlikely/to/exist', 'not to be an existing path'), 'to be fulfilled');
        });

        it('should reject the promise if a path does exist on disk', function () {
            expect.output.preferredWidth = 80;
            return expect(expect(existingPath, 'not to be an existing path'),
                'to be rejected with', 'expected \'' + existingPath + '\'\nnot to be an existing path');
        });
    });
});
