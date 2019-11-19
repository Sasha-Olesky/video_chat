'use strict';
var compress = require('koa-compress');
var logger = require('koa-logger');
var serve = require('koa-static');
var router = require('koa-router');
var route = require('koa-route');
var koa = require('koa');
var path = require('path');
var app = module.exports = koa();
var generateApi = require('koa-mongo-rest');
var mongoose = require('mongoose');
var bodyParser = require('koa-bodyparser');
var apn = require ('apn');
var options = {
           key : "./apns/key_dev.pem",
           cert : "./apns/dev_cert.pem",
           production : false
        };


mongoose.connect('mongodb://localhost:27017/prototype');
var model  = require('./models/devices');

app.use(logger());
app.use(bodyParser())      


// Serve static files
app.use(serve(path.join(__dirname, 'public')));
app.use(router(app));
app.use(route.post('/push', function * () {
	if (this.request.body.token && this.request.body.room) {
		var deviceToken = this.request.body.token;
		var room = this.request.body.room;
		var service = new apn.Connection(options);
        var tokens = [deviceToken];
        service.on("connected", function() {
            console.log("Connected");
        });

        service.on("transmitted", function(notification, device) {
            console.log("Notification transmitted to:" + device.token.toString("hex"));
            this.body = "Notification transmitted to:" + device.token.toString("hex");
            this.status = 200;
            console.log("Successfully sent!")
        });
        service.on("transmissionError", function(errCode, notification, device) {
            console.error("Notification caused error: " + errCode + " for device ", device, notification);
            if (errCode === 8) {
                console.log("A error code of 8 indicates that the device token is invalid. This could be for a number of reasons - are you using the correct environment? i.e. Production vs. Sandbox");
            }
            this.status = 500;
        });

        service.on("timeout", function () {
            console.log("Connection Timeout");
            this.status = 503;
        });
        service.on("disconnected", function() {
            console.log("Disconnected from APNS");
        });
        service.on("socketError", console.error);
        var note = new apn.notification();
        note.setAlertText("New call");
        note.badge = 1;
        note.payload = {'room': room};
        service.pushNotification(note, tokens);
	  	
	}else{
		console.log(this.request.body.token);
	 	this.status = 500;
	}
	  
}));





generateApi(app, model, '/api');

// Compress
app.use(compress());

if (!module.parent) {
  app.listen(2017);
  console.log('listening on port 2017');
}
