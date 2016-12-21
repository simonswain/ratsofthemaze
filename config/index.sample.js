'use strict';

module.exports = () => {

  let env = process.env.NODE_ENV || 'development';

  let  server = {
    host: '0.0.0.0',
    port: 6002
  }

  let services = {
    ga: {
      id: ''
    },
    assets: {
      key: '',
      secret: '',
      region: 'us-east-1',
      user: 'ratsofthemaze',
      bucket: 'ratsofthemaze.com-static',
      host: 'https://static.ratsofthemaze.com'
    },
    s3: {
      key: '',
      secret: '',
      region: 'us-east-1',
      user: 'ratsofthemaze',
      bucket: 'ratsofthemaze.com',
    }
  };

  return {
    env: env,
    server: server,
    services: services
  };

};
