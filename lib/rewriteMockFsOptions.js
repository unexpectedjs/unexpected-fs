var _ = require('lodash');
var mockfs = require('mock-fs');

function walkOptions(options) {
    if (typeof options === 'object') {
        Object.keys(options).forEach(function (key) {
            if (options[key]._isFile) {
                delete options[key]._isFile;
                options[key] = mockfs.file(options[key]);
            } else if (options[key]._isSymlink) {
                delete options[key]._isSymlink;
                options[key] = mockfs.symlink(options[key]);
            } else if (options[key]._isDirectory) {
                delete options[key]._isDirectory;
                if (options[key].items && typeof options[key].items === 'object') {
                    options[key].items = walkOptions(options[key].items);
                }
                options[key] = mockfs.directory(options[key]);
            } else if (typeof options === 'object') {
                options[key] = walkOptions(options[key]);
            }
        });
    }

    return options;
}


module.exports = function rewriteMockFsOptions(input) {
    var options = _.cloneDeep(input, function dealWithBuffers(val) {
       if (val instanceof Buffer) {
          return val.slice();
       }
    });

    Object.keys(options).forEach(function (key) {
        if (!(/^\//.test(key))) {
            options['/' + key] = options[key];
            delete options[key];
        }
    });

    return walkOptions(options);
};
