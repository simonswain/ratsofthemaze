'use strict';

var config = require('../config')(process.env.NODE_ENV);

var server = require('./server')(config);

server.start(() => {
  console.log('rats ' + config.env + ' ' + config.server.host + ':' + config.server.port);
});

process.on('SIGINT', () => {
  console.log('rats ' + config.env + ' ' + 'stopping...');
  server.stop(() => {
    console.log('rats ' + config.env + ' ' + 'finished');
  });
});
