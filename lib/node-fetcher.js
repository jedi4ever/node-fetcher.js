'use strict';

var request = require('request');
var fs = require('fs');
var zlib = require('zlib');
var Untar = require('tar-async/untar');

var tgzPlatforms = [ 'linux', 'darwin', 'sunos'];

var download = function(version, platform, arch, filename, callback) {
  if ( tgzPlatforms.indexOf(platform) >= 0) {
    return downloadTgz(version, platform, arch, filename, callback);
  } else {
    return callback(new Error('unsupported platform ' + platform));
  }
};

var downloadTgz = function(version, platform, arch, filename, callback) {
  var self = this;
  var url = downloadUrl(version, platform, arch);

  // Prepare the download stream
  var download = request(url,function (error, response, body) {
    if (error) {
      return callback(error);
    }
  });

  // Prepare the filewrite stream
  var fileWriter = fs.createWriteStream(filename);
  fileWriter.on('error', function(error) {
    if (error) {
      return callback(error);
    }
  });

  // Prepare the gunzip stream
  var gunzip = zlib.createGunzip();
  gunzip.on('error', function(error) {
    return callback(error);
  });

  // Prepare the untar stream
  var untar = new Untar(function (err, header, fileStream) {

    if (header) {
      if (header.filename) {
        if (endsWith(header.filename,'/bin/node')) {
          //console.log(header.filename);
          fileStream.on('end', function() {
            return callback(null);
          });
          fileStream.pipe(fileWriter);
        }
      }
    }
  });

  // Start the download process
  download.pipe(gunzip).pipe(untar);
};

var util = require('util');

var downloadUrl = function(version, platform, arch) {
  var url;
  if ( tgzPlatforms.indexOf(platform) >= 0) {
    url =  util.format('http://nodejs.org/dist/v%s/node-v%s-%s-%s.tar.gz', version, version, 'linux', arch );
  }

  return url;
};

var endsWith = function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

module.exports = {
  'download': download,
  'downloadUrl': downloadUrl
};
