# unexpected-fs

Mock filesystem for your assertions.

[![NPM version](https://badge.fury.io/js/unexpected-fs.svg)](https://www.npmjs.com/package/unexpected-fs)
[![Build Status](https://travis-ci.org/unexpectedjs/unexpected-fs.svg?branch=master)](https://travis-ci.org/unexpectedjs/unexpected-fs)
[![Coverage Status](https://coveralls.io/repos/unexpectedjs/unexpected-fs/badge.svg?branch=master)](https://coveralls.io/r/unexpectedjs/unexpected-fs?branch=master)
[![Dependency Status](https://david-dm.org/unexpectedjs/unexpected-fs.svg)](https://david-dm.org/unexpectedjs/unexpected-fs)

Be aware that when you mock out the file system it will have side effects for
the `require` function. `require` uses fs internally, and thus you will not be
able to load modules from your local file system if you mount a mock-fs that
shadows that location. This problem is mitigated by the fact that the mock file
system will only exist while your assertion is running.

# Usage

The `unexpected-fs` plugin adds the 'with fs mocked out' assertion to
the assertion framework unexpected. You can mix it into any sequence
of assertions, and it will patch the fs module for the assertions
following it.

Take the following example:

```js
var expect = require('unexpected');

var fs = require('fs');

function fileContentCAPS(filename) {
    var fileContent = fs.readFileSync('/data/' + filename, 'utf-8');
    return fileContent.toUpperCase();
}

expect('foobar.txt', 'when passed as parameter to', fileContentCAPS,
       'to equal', 'HELLO WORLD');
```

For that test to pass, you have to place fixtures on the file
system. That poses two problems:

- You remove data out of the context of the test.
- Your tests become reliant on the file system.

In the following example, we mount a mocked fs on the path `/data/`
with a file named `foobar.txt`.


```js
var expect = require('unexpected')
    .clone()
    .installPlugin(require('unexpected-fs');

var fs = require('fs');

function fileContentCAPS(filename) {
    var fileContent = fs.readFileSync('/data/' + filename, 'utf-8');
    return fileContent.toUpperCase();
}

expect('foobar.txt', 'with fs mocked out', {
    '/data': {
        'foobar.txt': 'Hello world',
    }
}, 'when passed as parameter to', fileContentCAPS, 'to equal', 'HELLO WORLD');
```

See the test suite in
[express-jsxtransform](https://github.com/gustavnikolaj/express-jsxtransform/blob/master/test/jsxtransform.js)
for a real life example of how it simplify your tests.

# Assertions

## `with fs mocked out`

Mocking out the filesystem for the rest of the rest of the duration of
the given call to unexpected.

```js
function fileContentCAPS(filename) {
    var fileContent = fs.readFileSync(filename, 'utf-8');
    return fileContent.toUpperCase();
}

expect('/data/foobar.txt', 'with fs mocked out', {
    '/data': {
        'foobar.txt': 'Hello world',
    }
}, 'when passed as parameter to', fileContentCAPS, 'to equal', 'HELLO WORLD');
```

## `to be a (path|text file) satisfying`

Assert that the stats of a given path, or the stats, and the content,
of a given path to a text file, satisfies the given object.

```js
expect('/path/to/file', 'to be a text file satisfying', {
    ctime: new Date('Sun Jun 14 2015 23:40:01 GMT+0200'),
    content: 'the content as a utf-8 string'
});
```

The instance methods from fs.Stats, `isFile`, `isDirectory`,
`isSymbolicLink`, `isBlockDevice`, `isCharacterDevice`, `isFIFO` and
`isSocket`, is all made available as booleans on the stats object
which is `'to satisfied'` against.

```js
expect('/path/to/directory', 'to be a path satisfying', {
    isDirectory: true,
    mode: 16877
});
```

## `<string> [not] to be an existing path`

Asserts that the given string is a path that exists on the file system, or not.

```js
expect('/path/that/does/not/exist', 'not to be an existing path');
```

```js
expect('/', 'to be an existing path');
```

# mock-fs and mountfs

This module is just a custom assertion that uses two other modules
to mock out the filesystem for the duration of the expect call.

[mock-fs](https://github.com/tschaub/mock-fs) is used to create the
file system it self, and
[mountfs](https://github.com/papandreou/node-mountfs) to mount those
filesystems on top of the real filesystem.

mountfs is used to avoid altering more than necessary. If you only used
mock-fs, you would change fs entirely for the entire process, which would
mean that you could not test code that relied on lazy loading of modules
through require for example.

# How mock-fs is used

To make mock-fs work for us in this context I had to depart from their
[API](https://github.com/tschaub/mock-fs/blob/master/readme.md) on a
few ways:

The `mock.file()` helper method would not be available as the user should
not be required to do more than just install the unexpected-fs plugin.
Using mock fs you would call with an options object, like so:

```js
mock.file({
    ctime: new Date(112432332),
    content: 'foobar'
});
```

You can do the same with unexpected-fs, by just passing the options object
but adding a property called `_isFile` with the value of `true`.

```js
{
    _isFile: true,
    ctime: new Date(112432332),
    content: 'foobar'
}
```

Before passing the arguments on to mock-fs, the `_isFile` property will
be removed and the object will be passed to `mock.file`.

The same is true for the `mock.directory` and `mock.symlink` methods,
and the corresponding properties is called `_isDirectory` and
`_isSymlink`.

Another difference is a consequence of how mountfs is added to the mix.
mock-fs would normally overwrite the entire global fs module, and you
would not be able to read from the already existing file system.
That is solved by only mocking out part of the file system, as given
by the mountPath. Say that we want to mock out a file called journal.txt
in the folder `/home/john/notes`.

```js
it('should be able to read the contents of a file', function () {
    return expect(function () {
        var fs = require('fs');
        var fileContent = fs.readFileSync('/home/john/notes/journal.txt', 'utf-8');
        return expect(fileContent, 'to equal', 'foo bar');
    }, 'with fs mocked out', {
        '/home/john/notes': {
            'journal.txt': 'foo bar'
        }
    }, 'not to throw');
});
```

If the original file system had data in `/home/john/notes/` those data
will now be hidden by our mock fs. If the folders `/home`, or `/home/john`,
or `/home/john/notes` did not exist on the original file system, they
will appear to do now.

You are not able to mock out files, without mounting a mock-fs first. So
the following example will NOT work:

```js
expect(..., 'with fs mocked out', {
    '/path/to/file.txt': 'blah'
}, ...);
```

While it could be convenient to do it like the above example, it is a
tradeoff which enables us to mount multiple small mocked file systems
instead of having to override everything at once. Each key, on the
root level of the configuration object will be it's own little mock fs.
Consider this example:

```js
expect(..., 'with fs mocked out', {
    '/home/john/notes': { ... },
    '/home/john/documents': { ... }
}, ...);
```

That allows us to mock out both folders mentioned in the object, while
still being able to read stuff in the folders outside of the mounted
mock file systems.

# Known Quirks

A mounted mock file system will not show up in directory listings on the normal
file system. See the below example:

```js
// assuming a folder named `john` in /home on the local file system.
expect(function (cb) {
    fs.readdir('/home', cb);
}, 'with fs mocked out', {
    '/home/jane': {...}
}, 'to call the callback without error').then(function (files) {
    // this assertion will fail, as the mocked folder `jane` will not show up in
    // the directory listing.
    return expect(files, 'to satisfy', [
        'john',
        'jane'
    ]);
});
```

# License

This module is made public under the ISC License.

See the LICENSE file for additional details.
