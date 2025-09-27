/*
|--------------------------------------------------------------------------
| Tests
|--------------------------------------------------------------------------
|
| This file is used to configure the test runner and setup the test
| environment for your application.
|
*/

import 'reflect-metadata'
import sourceMapSupport from 'source-map-support'
import { Ignitor } from '@adonisjs/core/build/src/Ignitor'
import { configure, run } from '@japa/runner'

process.env.NODE_ENV = 'testing'
sourceMapSupport.install({ handleUncaughtExceptions: false })

const ignitor = new Ignitor(__dirname)

configure({
  ...require('./.adonisrc.json').tests,
  ...{
    setup: [
      () => ignitor.httpServer().start(),
    ],
    teardown: [
      () => ignitor.httpServer().close(),
    ],
  },
})

run()