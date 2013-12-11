


var app	= require('./app/app-config');

(require('./bootstrap'))(app);

app.getServer().listen(1234,'localhost');