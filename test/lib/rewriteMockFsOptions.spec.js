var expect = require('unexpected');
var rewriteMockFsOptions = require('../../lib/rewriteMockFsOptions');

describe('rewriteMockFsOptions', function () {
    it('should not return the same object, even if no rewriting is done', function () {
        var originalValue = {
            '/foobar.txt': 'foobar!'
        };
        return expect(rewriteMockFsOptions(originalValue), 'to satisfy',
                      expect.it('to equal', originalValue)
                            .and('not to be', originalValue));
    });
    it('should map objects with the _isFile property set to true through mock.file', function () {
        var options = {
            '/foobar.txt': {
                _isFile: true,
                content: 'foobar!'
            }
        };
        return expect(rewriteMockFsOptions(options), 'to satisfy', {
            '/foobar.txt': expect.it('when called with', [], 'to satisfy', {
                _content: new Buffer('foobar!')
            })
        });
    });
    it('should map objects with the _isDirectory property set to true through mock.directory', function () {
        var options = {
            '/data': {
                _isDirectory: true,
                items: {
                    'foobar.txt': 'foobar!'
                }
            }
        };
        return expect(rewriteMockFsOptions(options), 'to satisfy', {
            '/data': expect.it('when called with', [], 'to satisfy', {
                '_items': {
                    'foobar.txt': {
                        _content: new Buffer('foobar!')
                    }
                }
            })
        });
    });
    it('should map objects with the _isSymlink property set to true through mock.symlink', function () {
        var options = {
            '/regularFile': 'foobar',
            '/aSymLink': {
                _isSymlink: true,
                path: 'regularFile'
            }
        };
        var rewrittenOptions = rewriteMockFsOptions(options);
        return expect(rewrittenOptions['/aSymLink'](), 'to satisfy',
                      expect.it('not to have property', '_isSymlink')
                            .and('to have property', '_path', 'regularFile')
                            .and('to have properties', [
                                '_ctime',
                                '_atime',
                                '_mtime',
                                '_mode',
                                '_uid'
                            ]));
    });
    it('should map objects with the _isFile property inside a _isDirectory property through mock.file', function () {
        var options = {
            '/data': {
                _isDirectory: true,
                items: {
                    'foobar.txt': {
                        _isFile: true,
                        content: 'foobar!'
                    }
                }
            }
        };
        return expect(rewriteMockFsOptions(options), 'to satisfy', {
            '/data': expect.it('when called with', [], 'to satisfy', {
                '_items': {
                    'foobar.txt': {
                        _content: new Buffer('foobar!')
                    }
                }
            })
        });
    });
    it('should resolve relative paths to / on the first level', function () {
        var options = {
            'foobar.txt': 'foobar'
        };
        return expect(rewriteMockFsOptions(options), 'to satisfy', {
            '/foobar.txt': 'foobar'
        });
    });
    it('should not resolve relative paths to / on the second level', function () {
        var options = {
            'foobar.txt': 'foobar',
            'data': {
                'bar.txt': 'qux'
            }
        };
        return expect(rewriteMockFsOptions(options), 'to satisfy', {
            '/foobar.txt': 'foobar',
            '/data': {
                'bar.txt': 'qux'
            }
        });
    });
});
