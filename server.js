/*
|--------------------------------------------------------------------------
| AdonisJs Server
|--------------------------------------------------------------------------
|
| The contents in this file is meant to bootstrap the AdonisJs application
| and start the HTTP server to accept incoming requests. You must avoid
| making this file dirty and instead make use of `lifecycle hooks` provided
| by AdonisJs service providers for custom code.
|
*/

const sourceMapSupport = require('source-map-support')
sourceMapSupport.install({ handleUncaughtExceptions: false })

const { Ignitor } = require('@adonisjs/core/build/standalone')

new Ignitor(__dirname)
  .httpServer()
  .start()