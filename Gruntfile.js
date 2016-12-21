"use strict";

module.exports = (grunt) => {
  grunt.initConfig({
    pkg: '<json:package.json>',
    jshint: {
      app: [
        'server/app/js/**/*.js',
        'server/app/js/*.js'
      ],
      options: {
        browser: true,
        asi: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        esnext: true,
        node: true
      }
    },
    env: {
      dev: {
        NODE_ENV: 'development'
      },
      production: {
        NODE_ENV: 'production'
      }
    }
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('default', ['lint']);
};
