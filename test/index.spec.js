var unexpected = require('unexpected');
var unexpectedFs = require('../');

describe('unexpected-fs', function () {
    describe('with fs mocked out', function () {
        var fileContent = function (fileName) {
            return require('fs').readFileSync('/data/' + fileName, 'utf-8');
        };

        var expect = unexpected
            .clone()
            .installPlugin(unexpectedFs);

        it('should not throw', function () {
            return expect('foobar.txt', 'with fs mocked out', {
                '/data/': {
                    '/foobar.txt': 'Foobar!'
                }
            }, 'when passed as parameter to', fileContent, 'to equal', 'Foobar!');
        });

        describe('mock.file proxy', function () {
            it('should realise that an object is a file', function () {
                return expect(function () {
                    var fs = require('fs');
                    expect(fs.readFileSync('/foo.txt', 'utf-8'), 'to satisfy', 'foobar!');
                    expect(fs.statSync('/foo.txt'), 'to satisfy', {
                        ctime: new Date(1)
                    });
                }, 'with fs mocked out', {
                    '/': {
                        '/foo.txt': {
                            _isFile: true,
                            ctime: new Date(1),
                            content: 'foobar!'
                        }
                    }
                }, 'not to throw');
            });
        });
        it('should allow reading files on the normal fs', function () {
            return expect(function () {
                var path = require('path');
                var fs = require('fs');
                var packageJsonPath = path.resolve(__dirname, '..', 'package.json');
                var packageJson = fs.readFileSync(packageJsonPath, 'utf-8');
            }, 'with fs mocked out', {}, 'not to throw');
        });
        it('should allow reading files on different mounted mock fs', function () {
            var path = require('path');
            var mockFs = {};
            mockFs[path.resolve(__dirname, 'wtf') + '/'] = {
                '/FUNNYSTORY.md': 'lol, just kidding.'
            };
            mockFs[path.resolve(__dirname, 'lol') + '/'] = {
                '/SADSTORY.md': 'wtf, just kidding?'
            };
            return expect(function () {
                var fs = require('fs');
                var path = require('path');
                var funnyStoryPath = path.resolve(__dirname, 'wtf', 'FUNNYSTORY.md');
                var funnyStory = fs.readFileSync(funnyStoryPath, 'utf-8');
                expect(funnyStory, 'to equal', 'lol, just kidding.');
                var sadStoryPath = path.resolve(__dirname, 'lol', 'SADSTORY.md');
                var sadStory = fs.readFileSync(sadStoryPath, 'utf-8');
                expect(sadStory, 'to equal', 'wtf, just kidding?');
            }, 'with fs mocked out', mockFs, 'not to throw');
        });
        it('should allow reading both files on the real fs and the mocked out one', function () {
            var path = require('path');
            var mockFs = {};
            mockFs[path.resolve(__dirname, 'wtf') + '/'] = {
                '/FUNNYSTORY.md': 'lol, just kidding.'
            };
            mockFs[path.resolve(__dirname, 'lol') + '/'] = {
                '/SADSTORY.md': 'wtf, just kidding?'
            };
            return expect(function () {
                var fs = require('fs');
                var path = require('path');
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
            var fs = require('fs');
            var someMethod = function (fileName) {
                return fs.readFileSync('/' + fileName, 'utf-8');
            };

            var expect = unexpected
                .clone()
                .installPlugin(unexpectedFs);
            return expect('doesIt.txt', 'with fs mocked out', {
                '/': {
                    '/doesIt.txt': 'Yes it does!'
                }
            }, 'when passed as parameter to', someMethod, 'to equal', 'Yes it does!');
        });
    });
});
