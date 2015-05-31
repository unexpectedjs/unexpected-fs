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
});
