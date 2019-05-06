nodejs-mvc
==========

Fast and simple MCV in nodejs


### [Section 1] Starting an Application

```javascript

	var app	= require("nodejs-mvc");
	var appVars	= app.getVars();

	var server	= require("http").createServer(function( request, response, next ) {
		app.handleServerResponse( request, response, next );
	});

	app.sessionCookieName("ssid");
	app.sessionDynCookieName("ssid");
	app.sessionDynCookieDomain(false);

	// from request.secretCookieKey it reads secret key for decoding cookie



	app.sessionDynAutoUpdate(true);
	app.sessionDynExpire(60*60*2);

	app.setRootPath( __dirname );
	app.setPublicPath( __dirname+'/public');
	app.setModulePath( __dirname+'/app/modules');
	app.runBootstrap();

	server.listen(8080);
```

### Starting an Application with an additional `static server`

```javascript

	var app	= require("nodejs-mvc");
	var appVars	= app.getVars();

	app.sessionCookieName("ssid");
	app.sessionDynCookieName("ssid");
	app.sessionDynCookieDomain(false);
	app.sessionDynAutoUpdate(true);
	app.sessionDynExpire(60*60*2);

	app.setRootPath( __dirname );
	app.setPublicPath( __dirname+'/public');
	app.setModulePath( __dirname+'/app/modules');

	var server	= require("http").createServer(function( request, response, next ) {
		app.handleServerMidleware(request, response, function () {
			if (request.url.match(/(\/|)(styles|images|scripts)/)) {
				// will be search files in public path
				app.handleStaticResponse(request, response);
			} else if (request.url.match(/(\/|)(node-docs)/)) {
				// will be search static files in a custom path
				app.handleStaticResponse(request, response, "/var/www/node-js/");
			} else {
				app.handleServerResponseLogic( request, response, next );
			}
		});
	});

	app.runBootstrap();

	server.listen(8080);

	// method to call handleStaticResponse
	// in callback you get only one parameter ( err ) in case of file was not found
	//	app.handleStaticResponse(request, response, path, callback);
	//	app.handleStaticResponse(request, response, path);
	//	app.handleStaticResponse(request, response, callback);

```

### [Section 2] Attaching a "socket.io" to server and assign SESSION and COOKIES

```javascript

	/*************************************
	 * Attaching SocketIO v.1.3.7 server *
	 *************************************/

	var app = require("nodejs-mvc");
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
				console.log("authorization-no-session::Cookies: ", data.session, data.cookies);
				accept(null, true);
			} else {
				console.log("authorization-session::Cookies: ", data.session, data.cookies);
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

	console.log("Lunching server on port 8080");
	console.log("test on: http://localhost:8080");
```

### Application adding controllers and actions

> A demo application you will see in ./demo/mvc-sample/app.js

Defining the folder were a stored controllers: `app.setModulePath("app/modules");

File structure of an controller and actions:
```
    app
    ⊢  modules
        ⊢ index            # folder for controller "index"
           ⊢ controller
              ⊢ index.js   # default action
              ⊢ create.js  # default other action named "create"
```

#### Actions's file "app/modules/index.js"

```javascript
	module.exports	= {
		"public"	: true,	// define action as public default:false
		"postData"	: false,	// if `true` the service will wait while POST data
								// will be loaded in request object
								// POST data will be returned by request.postVars()
								// FILES will be returned by request.fileVars()
		"maxPostSize"	: 1024*1024, // default 1Mb
								// may be set true if action is sync without callbacks
		capture	: function( request, response, app, controller, action ) {
			// redner the view index
			controller.render( response, 'index', { username: "sergiu gordienco" });
		}
	};
```

#### Controllers's Methods
```javascript
	module.exports	= {
		"public"	: false,	// define action as public default:false
		capture	: function (request, response, app, controller, action) {
			// list controller methods
			app.debug(true);
			app.console.log(controller);
			response.end();
		}
	};
```

 * `controller.getViewer()`	- returns viewer Object
 * `controller.getName()`	- returns controller name
 * `controller.getView( str_viewName )`	- returns view `Object` or `false` if it don't exists
 * `controller.viewExists( str_viewName ) - returns Boolean `true` if view exists else returns `false`
 * `controller.render( response, viewName, parameters )`	- if viewExists render view else doesn't do any thing
 * `controller.removeView( viewName )`	- removes view if it exists under an action on success return `true` else returns `false`
 * `controller.getAction( actionName )`	- return a action `Object` or `false`
 * `controller.actionExists( actionName )`	- return `true` if action exists
 * `controller.addAction( actionName, configActionObject )`	- add action to controller if action already exists returns `false`
 * `controller.removeAction( actionName )`	- removes action from controller on success returns `true` else `false`
 * `controller.getVars()`	- return controllers vars object that can be used by all functions, and it is common for all user sessions

#### Action's Methods
```javascript
	action = controller.getAction("library");
```

 * `action.getController()`	- returns controller object
 * `action.getName()`	- return action name
 * `action.isPublic()`	- returns `true` if `public` is `true` else `false`
 * `action.usePostData()`	- returns `true` if `postData` is `true` else `false`
 * `action.maxPostSize(numberBytes)` - if `numberBytes` is a number it updates `maxPostSize` parameter, even function returns current maxPostSize
 * `action.run( request, response )` - run a action and returns `true` on success else returns `Error` object


### Session vs SessionDyn

Using a session in a action:
```javascript
module.exports	= {
	public	: 1,
	capture	: function (request, response, app, controller, action) {
		var sess = request.session
		if (sess.views) {
			sess.views++
			response.setHeader('Content-Type', 'text/html')
			response.write('<p>views: ' + sess.views + '</p><p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>', function (err) {
				if (err) console.error(err);
				response.end();
			});
		} else {
		sess.views = 1
			response.end('welcome to the session demo. refresh!')
		}
	}
}
```

### SessionDyn `request.sessionDyn`

**sessionDyn** is much faster then other sessions, but it is stores object references in memory,
it is very optimized, and practically, doesn't store additional metadata.

 * `request.sessionDyn.ip()` - returns current user ip
 * `request.sessionDyn.host()` - returns `request.headers.host`
 * `request.sessionDyn.origin()` - returns `request.headers.origin`;
 * `request.sessionDyn.hashSession( sessionId )` - returns hashed `sessionId`
 * `request.sessionDyn.genSessionId()` - returns a new valid sessionId
 * `request.sessionDyn.sessionId()` - returns current sessionId
 * `request.sessionDyn.setExpire( secconds, sessionId )` - set session expire timeout, if `sessionId` is undefined it will update current session
 * `request.sessionDyn.getExpire( sessionId )` - get session expire timestamp, if `sessionId` is undefined it will work with current session
 * `request.sessionDyn.getCreated( sessionId )` - get creation `timestamp` for `sessionDyn` with id equal to `sessionId`
 * `request.sessionDyn.sessionExists( sessionId )`		: function( sessionId ) - retruns true if exists a `sessionDyn` with iq equal with `sessionId`
 * `request.sessionDyn.getVars( sessionId )` - will return variables from a `sessionDyn` if it exists, if `sessionId` is `undefined` will return variables from current `sessionDyn` if sessionExists else retruns `false`

### Request methods

 * `request.headers`   - object that contains headers `{ "header name" : "header value", .... }`
 * `request.urlObject` - object that resulted on parsing current url
```javascript
    var url = "https://www.example.com/path/to-an-url?get=references#hash-link";
    console.log(url.parseURL(true));
```

**Result:**
```javascript
    {
        "original"  : "https://www.example.com/path/to-an-url?get=references#hash-link",
        "origin"    : "https://www.example.com","domain":"www.example.com",
        "domain_short"  : "example.com",
        "pathname"  : "/path/to-an-url",
        "reqQuery"  : "get=references",
        "protocol"  : "https",
        "protocoll" : "https://",
        "url"       : "www.example.com/path/to-an-url?get=references#hash-link",
        "url_p"     : "https://www.example.com/path/to-an-url?get=references#hash-link",
        "isIp"      : "www.example.com",
        "get_vars"  : {
            "get"   : "references"
        }
    }
```

 * `request.controller`         - current controller name
 * `request.controllerAction`   - current action name
 * `request.params`             - current parameters array
 * `request.postData`           - `Buffer Object` where was stored original POST data
 * `request.postVars()`         - returns `POST` vars stored in a object ( available as `request.body` )

```javascript
	// for PUT method or other
	app.put(function (request, response, next) {
		request.postDataColect(next);
	});

	app.put('/chat',function (request, response) {
		response.send(request.body);
	});
```

 * `request.fileVars()`         - returns `FILE` vars stored in a object
 * `request.sessionDyn`         - returns `sessionDyn Object`
 * `request.session`            - returns `session Object`
 * `request.redirect( url, status )` - redirects to a specified url with a specified status ( default `status = 302` )
 * `request.postDataState`      - if `POST` data length is less that `action.maxPostSize` then it is `true` else `false`

### Response Methods

 * `response.req`                        - request related tu current request
 * `response.get(headerName)`            - return a header value
 * `response.append(headerName, val)`    - add value to a header, if header is already set, append second same header
 * `response.location(url)`              - add headers for redirect by url
 * `response.clearCookie(name, options)  - removing a coockie
 * `response.cookie(name, val, options)  - addinf a cookie
     * `options.signed`             - if true, hash the cookie
     * `options.expires`            - absolute expiration date for the cookie (Date object)
     * `options.path`               - cookie path
     * `options.maxAge`             - relative max age of the cookie from when the client receives it (seconds)
     * `options.domain`             - domain for the cookie
     * `options.secure`             - true or false
     * `options.httpOnly`           - true or false
 * `response.pipe(filePath, callback, request)`
    _piping a file from_ `filePath` _to_ `response`
    `response` _is not closed/ended_
    `callback` _captures `err` in case of in-success_ `function (err) { /*...*/ }`
    `request` _is optional ( used for `Content-Range` header)_
 * `response.download(filePath, fileName, callback, request)`
    _piping a file from_ `filePath` _to_ `response`
    `fileName` _filename for downloaded file_
    `response` _is not closed/ended_
    `callback` _captures `err` in case of in-success_ `function (err) { /*...*/ }`
    `request` _is optional ( used for `Content-Range` header)_
 * `response.staticResource(filePath, fileName, callback, request)`
    _piping a file from_ `filePath` _to_ `response`
    `fileName` _filename for returned file_
    `response` _is not closed/ended_
    `callback` _captures `err` in case of in-success_ `function (err) { /*...*/ }`
    `request` _is optional ( used for `Content-Range` header)_


## Templates Env references

```js
var app = require("nodejs-mvc")();

app.templateEnv({
	author: "sergiu-gordienco"
});

// in templates will be available a reference env with data { author: "sergiu-gordienco" }
```

## application viewer - Viewer Object

Small overview

```js
	debugMode	: function (status) {
		// updates or just return current debug status
	},
	getEnvVars	: function() {
		// return envVars;
	},
	updateEnvVars	: function( data ) {
		// updates env vars
	},
	renderCode	: function (code, vars, virtualFilePath, cb) {
		// code - the code to e rendered
		// vars - this reference will be available in template as "vars"
		// virtualFilePath - reference path that will be used for searching included files
		// cb - callback for getting results
			// arguments:
				// error - ( Array of errors ) or ( undefined )
				// html - String code
	}
```

## Email Object

## Examples
```js
	var app = require("nodejs-mvc");
	var Email = app.Email
	var myMsg = new Email(
	{ from: "me@example.com"
		, to:   "you@example.com"
		, subject: "Knock knock..."
		, body: "Who's there?"
	});

	// if callback is provided, errors will be passed into it
	// else errors will be thrown
	myMsg.send(function(err){ ... })
```

Note that no callback was passed into `send()`, therefore errors will throw.

## Options

```js
	new Email(config)
```

config options:

- to {array|string}
  - Email address(es) to which this msg will be sent
- from {string}
  - Email address from which this msg is sent. If not set
    defaults to the `exports.from` global setting.
- replyTo {string}
  - Email address to which replies will be sent. If not set
    defaults to `from`
- cc {array|string}
  - Email address(es) who receive a copy
- bcc {array|string}
  - Email address(es) who receive a blind copy
- subject {string}
  - The subject of the email
- body {string}
  - The message of the email
- bodyType {string}
  - Content type of body. Only valid option is 'html' (for now).
    Defaults to text/plain.
- altText {string}
  - If `bodyType` is set to 'html', this will be sent as the text
    alternative.
- timeout {number}
  - Duration in milliseconds to wait before killing the process.
    If not set, defaults to `exports.timeout` global setting.
- path {string}
  - Optional path to the sendmail executable
- debug {boolean}
  - Print debug info


## TODO documentation for following objects

app.debug
app.console
app.templateManager
app.getVars
app.maxPostSize
app.onMaxPostSize
app.sessionManager
app.\_events // .onError
app.httpStatuses

appInstance.\_functions.isValidIdentifier
appInstance.structure
appInstance.sessionExpire
appInstance.templateEnv
appInstance.sessionAutoUpdate
appInstance.getPublicPath
appInstance.getRootPath
appInstance.getLibPath
appInstance.getVendorPath
appInstance.viewer


## Templates FaceboxTPL

### To view parameters that are send have following structure

On template Rendering we have following variables

```javascript

	// variables that a sent from controllers
	var vars	= {};

	var env		= {
		error	: [],
		vars	: envVars,
		path	: "", // file path of current rendered template
		dirname	: "", // dirname of current rendered template
		render	: function( text, vars, env ) {}, // render function
		renderFile	: function( file, vars, callback ) {}, // render file function
			// callback( error {{ [] or false }}, htm)
	};

	// env vars sent from app
	env.vars = {
		response : [object] // http response object
	}
```

### An example how to render a view:

```javascript

	// file app/modules/index/controller/pageviews.js

	// file represents action page-views from controller index
	var _vars	= {
		pageviews	: 0
	};
	module.exports	= {
		public	: true,
		capture	: function( request, response, app, controller, action ) {
			// increasing page-views
			// sending page-views to view
			controller.render( response, 'index', { pageviews: (++_vars.pageviews) });
		}
	};
```

### Operation in templates

#### Include another template

```html
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>Document</title>
	</head>
	<body>
		<!-- Include rendered teplate -->
		{{render: env.vars.paths.layouts+"header.tpl" }}
		<div class="my-content">
			<!-- Include teplate and render with all content -->
			{{include: env.vars.paths.layouts+"header.tpl" }}
			Lorem ipsum Excepteur dolore labore nisi non.
		</div>
		<!-- Include rendered teplate -->
		{{render: env.vars.paths.layouts+"footer.tpl" }}
	</body>
	</html>
```

#### Executing operations in template code

```html
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>Document</title>
	</head>
	<body>
		{eval}
			vars.item_index	= 0;
		{/eval}
		<script type="text/facebox-template">
			vars.item_index	= 1;
		</script>
		<ul>
			<li>item {{ ++vars.item_index }}</li>
			<li>item {{ ++vars.item_index }}</li>
			<li>item {{ ++vars.item_index }}</li>
			<li>item {{ ++vars.item_index }}</li>
			<li>item {{ ++vars.item_index }}</li>
		</ul>
		{js-return}
			var message	= 'Were inserted '+vars.item_index+' items';
			// returning response that will be inserted
			return message;
		{/js-return}
		<script type="text/facebox-template">
			var message	= 'Were inserted '+vars.item_index+' items';
			// returning response that will be inserted
			return message;
		</script>
	</body>
	</html>
```


#### Isolate a section of code from parsing / no-format

```html
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>Document</title>
	</head>
	<body>
		{code}
			not parsed code ... even this "{{read:license.txt}}"
		{code}
	</body>
	</html>
```


#### Adding a script and a css style

```html
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>Document</title>
	</head>
	<body>
		{js-script}
			// javascript code
			alert("Hello");
		{js-script}
		{css-style}
			html, body {
				background	: white;
				color	: black;
			}
		{css-style}
	</body>
	</html>
```

#### Include content from a file without parsing it
```html
	<h1>License</h1>
	<pre><code>
		{{read:license.txt}}
	</code></pre>
```

#### Include content from a file encoded in HEX

```html
	<script type="text/javascript">
		var fileHexContent	= "{{read-hex:file.hex}}"
	</script>
```


#### Include content from a file encoded in base64
```html
	<img src="data:image/jpeg; base64,{{read-base64:image.png}}" />
```

## Using Extended prototype
> Extended template operations regarding prototype

### Escaping HTML chars

#### For strings references
```html
	<a href="{{ vars.url.toHtml() }}">{{ vars.user.name.toHtml() }}</a>
```

#### For other type of references
```html
	<a href="{{ ((vars.url || "") + "").toHtml() }}">{{ ((vars.user.name || "") + "").toHtml() }}</a>
```

## Global Functions

### Extend/Merge Objects

```javascript
	objMerge	= function(obj1, obj2, obj3, ..) { /*...*/ }
```

> extend object
> `objEncodeURL({ name: "foo", val : "23"}, { val: 24, val2: "abc"} )`
> result `{ name: "foo", val: 24, val2: "abc" }`

> remove poperty from object
> `objEncodeURL({ name: "foo", val : "23"}, { val: null, val2: "abc"} )`
> result `{ name: "foo", val2: "abc" }`

### Encode URL variables

```javascript
	objEncodeURL	= function(data, prefix) { /*...*/ }
```

> `objEncodeURL({ foo: 5, bar: [1,5,9], cid: "id-3453" })`
> result `foo=5&bar[0]=1&bar[1]=5&bar[2]=9&cid=id-3453`

> `objEncodeURL([{ foo: 5, bar: [1,5,9], cid: "id-3453" }, "test", { value: "123" }], "data")`
> result `data[foo]=5&bar[0]=1&bar[1]=5&bar[2]=9&cid=id-3453`

### Check references' types

Check if reference is an Array. Returns `boolean`

```javascript
	isArray = function() { /*...*/ };
```

Check if reference is a String. Returns `boolean`

```javascript
	isString	= function(val) {};
```

### Global Object m_store

#### Method **m_store.empty**:
Returns `true` if v is empty _( undefined, null, 0, "0", false, [], "" )_ else returns `false`;
if `objectCheck = true` then m_store.empty also will turn true for empty objects.

```javascript
	m_store.empty	: function(v, objectCheck) { /*...*/ };
```

#### Method **m_store.is_numeric**:
```javascript
	m_store.is_numeric	: function(v) { /*...*/ },
```

Return `true` if reference `v` is a number or a numeric string


#### Method **m_store.type**:
```javascript
	m_store.type	: function(val) { /*...*/ }
```

Detects following type of reference types,

 * return `'null'` for `null` reference
 * return `'string'` for _String_ reference or instanceof _String_
 * return `'boolean'` for `boolean` reference
 * return `'undefined'` for undefined references
 * return `'function'` for functions
 * return `'number'` for number
 * return `'array'` for array objects
 * return `'regexp'` for Regular Expressions
 * return `'object'` for Objects

#### Method **m_store.json**:

Following function encodes a reference into JSON object.
The function will encode different references, even:
	**functions**, **Infinity**, **-Infinity**, **NaN**, **undefined**

`maxEncodeDepth` if is not defined, default is `5`

```javascript
	m_store.json	: function(val, maxEncodeDepth ) {}
```

#### Method **m_store.getv**:

Return parsed JSON value. When `safeMode` is not specified or is _false_,
the method m_store.getv uses `eval` **(not safe)**

With `safeMode = true` will be used function JSON.parse
_( JSON parse will not be able to decode **functions**, **Infinity**, **-Infinity** or **NaN** references )_

```javascript
	m_store.getv	: function(val, safeMode) { /*...*/ }
```

### String Prototype

#### Subs Method:

```javascript
	String.prototype.subs	= function(string, offset, length) {}
```
> `"abcdefghi".subs(2)` is equal to `"ab"`
> `"abcdefghi".subs(2,3)` is equal to `"cde"`
> `"abcdefghi".subs(-2)` is equal to `"hi"`
> `"abcdefghi".subs(1,-2)` is equal to `"bcdefg"`
> `"abcdefghi".subs(-4,3)` is equal to `"fgh"`

#### Subs Method:

```javascript
	String.prototype.toHex = function(utf8String) { /*...*/ return hex_str; }
	String.prototype.fromHex = function(){ /*...*/ retrun utf8_str; },
```
> `"TEST".toHex()` is equal to `"54455354"`
> `"54455354".fromHex()` is equal to `"TEST"`
> `"54455354".fromHex()` is equal to `"TEST"`

> **UTF-8** vs Unicode
> Function `.toHex()` and `.fromHex` is working with **UTF-8** Strings
but javascript is working with **Unicode**
> `"€".toHex()` _(Unicode)_ 1 char in HEX is 2 chars `"20ac"`
> `"20ac".fromHex()` is " ¬"

> So correctly to encode UnicodeText to Hex is
> "€".utf8encode().toHex() and the result is `"e282ac"`
> and `"e282ac".fromHex().utf8decode()` is `"€"`

#### Escape HTML
```javascript
	String.prototype.toHtmlSimple	= function() { /*...*/ retrun str; },
	String.prototype.toHtml = function(){ /*...*/ return str;},
	String.prototype.cleanTags	= function() { /*...*/ return str; }
```

#### Check if word exists in a list of words separated by `" "`
```javascript
	// add class
	String.prototype.add_Class = function(x){},
	// remove class
	String.prototype.del_Class = function(x){},
	// check is calss exists
	String.prototype.fnd_Class = function(x){},
```

#### String letterCase change
```javascript
	String.prototype.swp_case = function(){ return str; }
	String.prototype.ucfirst = function(k){ return str; }
	String.prototype.lcfirst = function(k){ return str; }
```

#### Encoding Conversions
```javascript
	String.prototype.utf8need = function() { return bool_utf8 }
	String.prototype.utf8encode = function() { return utf8_str; }
	String.prototype.utf8decode = function(strUtf) { return unicode_str; }
	String.prototype.utf8	= String.prototype.utf8encode;
	String.prototype.unicode = String.prototype.utf8decode;

	String.prototype.escapeHex	= function() { /* ... */ return str; },
	// on execution: "#$%#$%^".escapeHex()
	// return "\x23\x24\x25\x23\x24\x25\x5E"

	String.prototype.escape		= function() { return escape(this); },
	String.prototype.encodeURI	= function() { return encodeURIComponent(this); },
	String.prototype.unescape	= function() { return unescape(this); },
	String.prototype.decodeURI	= function() { return decodeURIComponent(this); },

	String.prototype.toRegexp = function(flags){ return reg_exp_object; }
	// on execution: ".*".toRegexp("g")
	// returns: /.*/g
```

#### Parse URL links
```javascript
	String.prototype.parseUrlVars	= function(json,params) { retrun data_object; },
	String.prototype.parseMultipartFormData	= function(json,params,postToUtf8, hexData) { return data_object; },
	String.prototype.parseUrl	= function(url) { return object; }
```

**Examples**

##### Parse URL
```javascript
	"http://www.example.com/test?nr=1&module=mvc#link-1".parseUrl()
```javascript
**Returns**
```javascript
	{
		original	: "http://www.example.com/test?nr=1&module=mvc#link-1",
		origin	: "http://www.example.com",
		domain	: "www.example.com",
		domain_short	: "example.com",
		pathname: "/test",
		reqQuery	: "nr=1&module=mvc",
		protocol: "http",
		protocoll: "http://"
	};
```

##### Parse URL with GET vars
```javascript
	"http://www.example.com/test?nr=1&module=mvc&val[x]=5#link-1".parseUrl(true)
```javascript
**Returns**
```javascript
	{
		get_vars	: {
			nr	: 1,
			module	: mvc,
			val : {
				x	: 5
			}
		},
		original	: "http://www.example.com/test?nr=1&module=mvc#link-1",
		origin	: "http://www.example.com",
		domain	: "www.example.com",
		domain_short	: "example.com",
		pathname: "/test",
		reqQuery	: "nr=1&module=mvc",
		protocol: "http",
		protocoll: "http://"
	};
```

##### Parse URL retrieve only GET vars
```javascript
	"http://www.example.com/test?nr=1&module=mvc&val[x]=5#link-1".parseUrl("get_vars")
```javascript
**Returns**
```javascript
	{
		nr	: 1,
		module	: mvc,
		val : {
			x	: 5
		}
	}
```

##### Parse URL and retrieve only a property from parsed Object
```javascript
	"http://www.example.com/test?nr=1&module=mvc&val[x]=5#link-1".parseUrl("origin")
```
**Returns**
```javascript
	"http://www.example.com"
```
----
```javascript
	"http://www.example.com/test?nr=1&module=mvc&val[x]=5#link-1".parseUrl("reqQuery")
```
**Returns**
```javascript
	"nr=1&module=mvc"
```

#### Match a string using a reg expression described in a string
```javascript
	String.prototype.match_str	= function(regexp_str,regexp_flags) { /* ... */ }
```

#### Make a SHA1 Hash
```javascript
	String.prototype.sha1 : function(utf8){return Sha1.hash(this,( utf8 || typeof(utf8) == "undefined" ) ? true : false)},

	// "utf8" indicates that code firstly should be encoded to UTF-8 from UNICODE
	// default "utf8" argument is true
```
**Example:**
```javascript
	"password".sha1();
	// returns
	"5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8"
```

#### Make a SHA2 Hash
```javascript
	String.prototype.sha256 : function(utf8){return Sha256.hash(this,( utf8 || typeof(utf8) == "undefined" ) ? true : false)},

	// "utf8" indicates that code firstly should be encoded to UTF-8 from UNICODE
	// default "utf8" argument is true
```
**Example:**
```javascript
	"password".sha256();
	// returns
	"5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
```

#### Make a MD5 Hash
```javascript
	String.prototype.md5	: function() { /* ... */},
```
**Example:**
```javascript
	"password".md5();
	// returns
	"5f4dcc3b5aa765d61d8327deb882cf99"
```

#### For encoding JavaScript UNICODE code into Base64
```javascript
	String.prototype.base64encode	: function() { return btoa(this.utf8need()); },
```

#### For decoding JavaScript UNICODE code into Base64
```javascript
	String.prototype.base64decode	: function() { return atob(this).unicode(); },
```

#### For encoding JavaScript UTF8 and ASCII code into Base64
```javascript
	String.prototype.base64encodeClean	: function() { return btoa(this); },
```

#### For decoding JavaScript UTF8 and ASCII code into Base64
```javascript
	String.prototype.base64decodeClean	: function() { return atob(this); },
```

#### Encrypt a String using a passKey and TEA algorithm
```javascript
	String.prototype.encryptTea	: function(p) { /* ... */ },
```

#### Decrypt a String using a passKey and TEA algorithm
```javascript
	String.prototype.decryptTea	: function(p) { /* ... */ },
```

#### Encrypt a String using a passKey and passlength ( 128, 192, 256 ) in AES algorithm
```javascript
	String.prototype.encryptAes	: function(passKey, passlength) { /* ... */ },
```

#### Decrypt a String using a passKey and passlength ( 128, 192, 256 ) in AES algorithm
```javascript
	String.prototype.decryptAes	: function(passKey, passlength) { /* ... */ },
```

#### String Method buildQuery
```javascript
	String.prototype.buildQuery	: function() {
		var r	= /^\s*([a-z]+)\:\s*(\S[^\:]*?|)\s*(\s[a-z]+\:.*|)$/i
		var s = this, o = { "_keys" : [] }, m, k, f = s.split(/([a-z]+)\:/i);
		if( m = f[0].match(/^\s*(\S[\s\S]*?)\s*$/) ) {
			o["_keys"].push("_");
			o['_']	= m[1];
		};
		f = s.substring(f[0].length,s.length);
		while( m = f.match(r) ) {
			o[k = m[1].toLowerCase()]	= m[2];
			o["_keys"].push(k);
			f = f.split(m[0]).join(m[3]);
		};
		return o;
	},
```
**Example:**
```javascript
	"test:234 val:foo bar".buildQuery()
	// returns
	{
		"_keys" : ["test", "val"],
		"test"	: "234",
		"val"	: "foo bar"
	}
```
#### String Method buildSearchArray
```javascript
	String.prototype.buildSearchArray	: function() { /*...*/ return arr; }
```
**Example:**
```javascript
	"test 'foo bar'".buildSearchArray()
	// returns
	["test", "foo bar"]
```





### Array prototype

#### Array method (inArray) - search an element in a array with a defined comparator
```javascript
	/*
		comparator posible values:
		1. '==='	- check if is strict equal
		2. '=='		- check if is equal
		3. a _function_ :
		function(searched_item,array_item) {
			return searched_item === array_item
		}
	*/
	Array.prototype.inArray	= function(a,comparator) { /*...*/ },
```

#### Split an Array by an a value of one octet
```javascript
	Array.prototype.split	= function (elem, num, cmp) { /*...*/ },
```

#### Split an Array by an a section value of one or more bytes
```javascript
	Array.prototype.splitSect	= function(elem, num) {
		return this.split(elem, (num || 0), "indexOfSect");
	},
```

#### Convert a Array to an parameter object
```javascript
	Array.prototype.toParamObj	= function() { /*...*/ },
```

#### Remove from Array undefined values
```javascript
	Array.prototype.resetArray	= function() {return this.filter(function(v) { return ( typeof(v) != "undefined" ); })},
```

#### Find IndexOf position of a set of elements in a Array
```javascript
	Array.prototype.indexOfSect	= function (searchElement, fromIndex) { /*...*/ }
```

	Number.prototype.round	= function(k) {	if(k) return parseFloat(this.toFixed(k)); return Math.round(this);	},

	Number.prototype.ceil	= function() {	return Math.ceil(this);	},

	Number.prototype.floor	= function() {	return Math.floor(this);	}


### Buffer prototype

#### Split a Buffer by an a value of one octet
```javascript
	Buffer.prototype.split	= function (elem, num, cmp) {
		/* ... */
		return lines;
	}
```

#### Split a Buffer by an a section value of one or more bytes
```javascript
	Buffer.prototype.splitSect	= function(elem, num) {
		return this.split(elem, (num || 0), "indexOfSect");
	}
```


#### Converts a Buffer in a params object
```javascript
	Buffer.prototype.toParamObj	= function() { /*...*/ },
```

#### Find IndexOf a byte in a Buffer
```javascript
	Buffer.prototype.indexOf	= function(searchSequence, fromIndex) { /*...*/ },
```

#### Find IndexOf a section of bytes in a Buffer
```javascript
	Buffer.prototype.indexOfSect	= function(searchSequence, fromIndex) { /*...*/ },
```

## Console object was Extended

was added method **prompt**:

**Example:**

```js
console.prompt("rerun tests? [y/n]: ", function (err, buffer) {
	var response = buffer.toString().replace(/^\s*(.*?)\s*$/, '$1');
	if (response === 'y') {
		// TODO what you want...
	}
});

```

console output now is much better formated ( for teminal vt100 )


## Authors

 - Gordienco Sergiu

## License

(The MIT License)

Copyright (c) 2014 Gordienco Sergiu &lt;sergiu.gordienco@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
