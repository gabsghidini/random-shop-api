import Server from '@ioc:Adonis/Core/Server'

Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser'),
  () => import('App/Middleware/RequestLogger'),
  () => import('App/Middleware/RateLimit'),
  () => import('App/Middleware/PerformanceMonitor'),
])

Server.middleware.registerNamed({
  rateLimit: () => import('App/Middleware/RateLimit'),
  requestLogger: () => import('App/Middleware/RequestLogger'),
  performanceMonitor: () => import('App/Middleware/PerformanceMonitor'),
})