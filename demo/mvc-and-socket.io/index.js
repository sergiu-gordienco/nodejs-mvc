


// var app = require("nodejs-mvc");
var app	= require(__dirname + "/../../index.js");
var appVars	= app.getVars();

var server	= require("http").createServer(function( request, response, next ) {
	app.handleServerResponse( request, response, next );
});

app.sessionCookieName("ssid");
app.sessionDynCookieName("ssid");
app.sessionDynCookieDomain(false);
app.sessionDynAutoUpdate(true);
app.sessionDynExpire(60*60*2);

app.setRootPath( __dirname );
app.setPublicPath( __dirname+'/public');
app.setModulePath( __dirname+'/app/modules');
app.runBootstrap();


/****************************
 * Ataching SocketIO server *
 ***************************/

var io = require('socket.io')(server);

/**
 * adding session to socketio on authorisation
 */
io.set('authorization', function(data, accept) {
	// check if user has a session
	app.handleServerMidleware(data, {}, function (err) {
		if (!err) {
			console.log("authorization-no-session::signedCookies: ", data.session, data.cookies, data.signedCookies);
			accept(null, true);
		} else {
			console.log("authorization-session::signedCookies: ", data.session, data.cookies, data.signedCookies);
			accept(null, true);
		}
	});
});

io.sockets.on('connection', function (client) {
	var sessionCronTimer;

	// attaching session to socket
	app.handleServerMidleware(client.handshake, {}, function (err) {
		if (!err) {
			// adding client session
			client.session	= client.handshake.session;

			// adding cron form refreshing session
			sessionCronTimer	= setInterval(function () {
				client.handshake.session.reload( function () { 
					client.handshake.session.touch().save();
				});
			}, 2000);
		}
	});

	client.on('disconnect', function () {
		var er; try {
			clearInterval(sessionCronTimer);
		} catch (er) {};
	});
});


// attaching your events :)
// Building a chat room for sample

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

server.listen(8080);


