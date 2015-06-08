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
            "expected [ '/highlyUnlikely/foobar.txt' ] when passed as parameters to\n" +
            "function (fileName) {\n" +
            "    return fs.readFileSync(fileName, 'utf-8');\n" +
            "} to equal 'goodbye'\n" +
            "  expected 'hey' to equal 'goodbye'\n" +
            "\n" +
            "  -hey\n" +
            "  +goodbye"
        );
        expect(function () {
            fs.readFileSync('/highlyUnlikely/foobar.txt');
        }, 'to throw', new Error("ENOENT, no such file or directory '/highlyUnlikely/foobar.txt'"));
    });
});
