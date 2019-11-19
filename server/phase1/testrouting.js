"use strict"

const
  router = require('koa-router'),

  koa = require('koa'),
  app = koa();


//Middleware: request logger
function *reqlogger(next){
  console.log('%s - %s %s',new Date().toISOString(), this.req.method, this.req.url);
  yield next;
}
app.use(reqlogger);

//app.use(Router(app));
var api = new router();

api.get('/', function *(){
  console.log('Express-style example');
  this.body = "This is root page ('/')";
});

const publicRouter = new router();

publicRouter.get('/auth/github', function *(){
  console.log("Middleware-style Example");
  this.body = "Authenticate with GitHub OAUTH API (Coming Soon)";
});

app.use(publicRouter.middleware());


app.use(function *(){
  this.body = 'Hello World';
});

app.listen(2016);
