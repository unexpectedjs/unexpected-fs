var _ = require('lodash');
var mockfs = require('mock-fs');

function walkOptions(options) {
    if (typeof options === 'object') {
        Object.keys(options).forEach(function (key) {
            if (options[key]._isFile) {
                delete options[key]._isFile;
                options[key] = mockfs.file(options[key]);
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
    return walkOptions(_.cloneDeep(input));
};
