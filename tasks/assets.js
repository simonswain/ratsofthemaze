"use strict";

var async = require('async');
var _ = require('lodash');
var fs = require('fs');

module.exports = function (grunt) {
  grunt.registerTask(
    'assets',
    'Render and deploy static assets',
    function() {

      var done = this.async();
      var config = require( '../config')(process.env.NODE_ENV);
      var server = require('../server/server.js')(config);

      var mimes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'ico': 'image/x-icon',
        'gif': 'image/gif'
      };

      var AWS = require('aws-sdk');

      AWS.config.update({
        accessKeyId: config.services.assets.key,
        secretAccessKey: config.services.assets.secret
      });

      var base = __dirname + '/../server';

      var uploadFolder = (root, done) => {
        var uploadOne = (file, next) => {
          var source = base + '/' + root + '/' + file;
          var stats = fs.statSync(source);
          if (stats.isDirectory()) {
            uploadFolder(root + '/' + file, next);
          } else {
            var s3obj = new AWS.S3({
              params: {
                Bucket: config.services.assets.bucket,
                Key: root + '/' + file,
                ContentType: mimes[file.substr(-3)]
              }});
            s3obj.upload({
              Body: fs.createReadStream(source)
            }).send((err, data) => {
              console.log(root + '/' + file);
              if (err) {
                console.log('error:', err);
              }
              next();
            });
          }
        };

        var files = fs.readdirSync(base + '/' + root);
        async.eachSeries(files, uploadOne, done);
      };

      var syncImages = (done) => {
        if (config.env !== 'production') {
          return done();
        }
        uploadFolder('images', done);
      };

      var syncFonts = (done) => {
        if (config.env !== 'production') {
          return done();
        }
        uploadFolder('fonts', done);
      };

      async.series([
        server.assets.render,
        syncFonts,
        syncImages
      ], done);
    });
};
