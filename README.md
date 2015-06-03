# unexpected-fs

Mock filesystem for your assertions.

[![NPM version](https://badge.fury.io/js/unexpected-fs.svg)](https://www.npmjs.com/package/unexpected-fs)
[![Build Status](https://travis-ci.org/unexpectedjs/unexpected-fs.svg?branch=master)](https://travis-ci.org/unexpectedjs/unexpected-fs)
[![Coverage Status](https://coveralls.io/repos/unexpectedjs/unexpected-fs/badge.svg?branch=master)](https://coveralls.io/r/unexpectedjs/unexpected-fs?branch=master)
[![Dependency Status](https://david-dm.org/unexpectedjs/unexpected-fs.svg)](https://david-dm.org/unexpectedjs/unexpected-fs)

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

# License

This module is made public under the ISC License.

See the LICENSE file for additional details.
