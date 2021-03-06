const micro = require('micro')
const { router, get } = require('micro-fork')
const serveStatic = require('./libs/serve-static.js')
const serveIndex = require('./libs/serve-index.js')
const serve404 = require('./libs/serve-404.js')
const serveDocs = require('./libs/serve-docs.js')
const serveBadge = require('./libs/serve-badge.js')
const serveMetadata = require('./libs/serve-metadata.js')
const liveHandlers = require('./libs/live-handlers.js')
const serveApi = require('./libs/serve-api.js')
const raven = require('./libs/raven.js')

const indexHandler = (req, res) => {
  if (req.headers.host === 'badgen.now.sh') {
    res.setHeader('Location', 'https://badgen.net')
    micro.send(res, 301)
  } else {
    serveIndex(req, res)
  }
}

const serveStaticBadge = (req, res) => {
  serveBadge(req, res, { maxAge: '31536000' })
}

const main = router()(
  get('/*', serve404),
  get('/', indexHandler),
  get('/metadata.json', serveMetadata),
  get('/static/*', serveStatic),
  get('/docs/:topic', serveDocs),
  get('/badge/:subject/:status', serveStaticBadge),
  get('/badge/:subject/:status/:color', serveStaticBadge),
  ...liveHandlers
)

module.exports = (req, res) => {
  switch (req.headers.host) {
    case 'api.badgen.net':
    case '127.0.0.1:3000':
      return serveApi(req, res)
    default:
      return main(req, res)
  }
}

const autoRun = () => {
  if (require.main === module) {
    micro(module.exports).listen(3000)
  }
}

raven ? raven.context(autoRun) : autoRun()
