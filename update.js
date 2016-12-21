var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var AWS = require('aws-sdk');
var async = require('async');

var config  = require(__dirname + '/config')();

var opts = {
  s3: {
    user: config.services.s3.user,
    key: config.services.s3.key,
    secret: config.services.s3.secret,
    bucket: config.services.s3.bucket,
  }
}

AWS.config.region = 'us-east-1';
AWS.config.update({
  accessKeyId: opts.s3.key,
  secretAccessKey:opts.s3.secret
});

var root = __dirname + '/htdocs'


function fileMime(f) {
  var mime = 'application/octet-stream';
  var fn = f.toLowerCase();

  if (fn.indexOf('.html') >= 0) mime = 'text/html';
  else if (fn.indexOf('.css') >= 0) mime = 'text/css';
  else if (fn.indexOf('.json') >= 0) mime = 'application/json';
  else if (fn.indexOf('.js') >= 0) mime = 'application/javascript';
  else if (fn.indexOf('.png') >= 0) mime = 'image/png';
  else if (fn.indexOf('.jpg') >= 0) mime = 'image/jpg';
  else if (fn.indexOf('.mp3') >= 0) mime = 'audio/mpeg';
  else if (fn.indexOf('.txt') >= 0) mime = 'text/plain';
  return mime;
}

var putFile = function(f, done){

  if(!done){
    done = () => {}
  }

  var src = root + '/' + f;
  var target = f;
  var mime = fileMime(f);

  console.log(mime, f);

  var s3obj = new AWS.S3({
    params: {
      Bucket: opts.s3.bucket,
      Key: target,
      ContentType: mime,
      ACL:'public-read',
      CacheControl: 'max-age=300000'
    }
  });

  var body = fs.createReadStream(src);

  s3obj.upload({
    Body: body
  }).send(function(err, data) {
    if(err){
      console.log('error:', err);
    }
    done();
  });

}

putFile('index.html', function(){
})
putFile('style.css', function(){
})
putFile('script.js', function(){
})
