"use strict";

module.exports = (config, server, assets) => {
  return {
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
      reply.view('index', {
        js: assets.keys.pub.js(),
        css: assets.keys.pub.css(),
        ga_id: config.services.ga.id
      });
    }
  };
};
