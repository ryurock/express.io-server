express = require('express.io')
app = express().http().io()
redis = require('redis')
RedisStore = require('connect-redis')(express)

app.configure(function(){
    app.use(express.static(__dirname + '/public'))
})

// Setup your sessions, just like normal.
app.use(express.cookieParser())
app.use(express.session({
    secret: 'monkey',
    store: new RedisStore({
        client: redis.createClient()  
    }) 
}))

app.io.set('store', new express.io.RedisStore({
    redisPub: redis.createClient(),
    redisSub: redis.createClient(),
    redisClient: redis.createClient(),
}))

// Session is automatically setup on initial request.
app.get('/', function(req, res) {
    req.session.loginDate = new Date().toString()
    res.sendfile(__dirname + '/client.html')
})

app.io.route('ready', function(req) {
    req.io.emit('session-task-added', req.session)
})

// Setup a route for the ready event, and add session data.
app.io.route('get-task-value', function(req) {
    req.session.task = req.data
    req.session.save(function() {
        req.io.broadcast('session-task-added', req.session)
        req.io.emit('session-task-added', req.session)
    })
})

app.listen(7076)
