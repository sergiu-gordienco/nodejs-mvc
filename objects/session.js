var _sessions	= {};
var sessionCleaner	= function() {
	var t = new Date().valueOf();
	var i;for( i in _sessions ) {
		if( t > _sessions[i].expire )
			delete _sessions[i];
	}
};
setInterval(function() {
	sessionCleaner();
},1000);

module.exports	= function( req, res, app, options ) {

	var _sessionsLife	= 600;
	if (req === true && typeof(res) === "undefined") {
		var _functions	= {
			setExpire		: function( secconds, ssid ) {
				if( !ssid ) return false;
				var session	= _functions.getSession(ssid);
				if( session ) {
					session.expire	= new Date().valueOf() + ( (typeof(secconds) === "number" ? secconds : _sessionsLife) || 0 ) * 1000;
				}
			},
			getExpire		: function( ssid ) {
				if( !ssid ) return false;
				var session	= _functions.getSession(ssid);
				if( session ) {
					return session.expire;
				}
				return false;
			},
			getCreated		: function( ssid ) {
				if( !ssid ) return false;
				var session	= _functions.getSession(ssid);
				if( session ) {
					return session.created;
				}
				return false;
			},
			sessionExists		: function( ssid ) {
				return ( ssid && ssid in _sessions );
			},
			getSession	: function( ssid ) {
				if( !ssid ) return false;
				if( ssid in _sessions ) {
					return _sessions[ssid];
				}
				return false;
			},
			getVars	: function( ssid ) {
				if( !ssid ) return false;
				if( ssid in _sessions ) {
					return _sessions[ssid].vars;
				}
				return false;
			}
		};
		return _functions;
	};
	var _config	= {
		cookieName		: 'ssiddyn',
		cookieDomain	: false,
		ssid			: false
	};
	if( typeof(options) === "number" ) {
		_sessionsLife	= options;
	} else {
		if( 'expire' in options && typeof( options.expire ) === "number" ) {
			_sessionsLife	= options.expire;
		}
		if( 'cookieName' in options && ( typeof( options.cookieName ) === "string" && options.cookieName ) ) {
			_config.cookieName	= options.cookieName;
		}
		if( 'cookieDomain' in options && ( typeof( options.cookieDomain ) === "string" || options.cookieDomain === false ) ) {
			_config.cookieDomain	= options.cookieDomain;
		}
	};
	var _functions = {
		ip	: function() {
			var er;
			var r = undefined;
			try {
				r = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || undefined;
			} catch (er) {};
			return r;
		},
		host	: function() {
			if (req.headers) {
				return ( req.headers.host || "" );
			}
			return "";
		},
		origin	: function() {
			if (req.headers) {
				return ( req.headers.origin || "" );
			}
			return "";
		},
		hashSession		: function( session ) {
			return (""+session).sha256();
		},
		genSessionId	: function() {
			return _functions.ip()+'-'+new Date().valueOf().toString(36)+'-'+Math.floor(Math.random()*1000000000).toString(36)+'-'+Math.floor(Math.random()*1000000000).toString(36);
		},
		sessionId	: function() {
			var ssid	= false;
			ssid	= _config.ssid || req.cookie(_config.cookieName, { secure: false }) || req.cookie(_config.cookieName, { secure: true }) /*|| req.getVars().ssid*/ || "";

			if( !ssid ) {
				ssid	= _functions.hashSession(_functions.genSessionId());
				_config.ssid	= ssid;
				var o	= {
					httpOnly	: false,
					overwrite	: true,
					signed		: false,
					path		: "/",
					overwrite   : true,
					expires		: new Date( new Date().valueOf() + _sessionsLife * 1000 ),
					maxAge		: new Date( new Date().valueOf() + _sessionsLife * 1000 ).valueOf()
				};

				if( _config.cookieDomain )
					o.domain	= _config.cookieDomain;

				if (ssid && typeof(res.cookie) === "function") {
					res.cookie( _config.cookieName, ssid, o );

					if (req.isHttps) {
						o.secure = true;

						res.cookie( _config.cookieName, ssid, o );
					}
				}
			}
			if( !( ssid in _sessions ) ) {
				var t = new Date().valueOf();
				_sessions[ssid]	= {
					created	: t,
					expire	: t+_sessionsLife*1000,
					vars	: {}
				};
			}
			return ssid;
		},
		setExpire		: function( secconds, ssid ) {
			if( !ssid ) ssid = false;
			var session	= _functions.getSession(ssid);
			if( session ) {
				session.expire	= new Date().valueOf() + ( (typeof(secconds) === "number" ? secconds : _sessionsLife) || 0 ) * 1000;
			}
		},
		getExpire		: function( ssid ) {
			if( !ssid ) ssid = false;
			var session	= _functions.getSession(ssid);
			if( session ) {
				return session.expire;
			}
			return false;
		},
		getCreated		: function( ssid ) {
			if( !ssid ) ssid = false;
			var session	= _functions.getSession(ssid);
			if( session ) {
				return session.created;
			}
			return false;
		},
		sessionExists		: function( ssid ) {
			return ( ssid && ssid in _sessions );
		},
		getSession	: function( ssid ) {
			if( !ssid ) ssid = _functions.sessionId();
			if( ssid in _sessions ) {
				return _sessions[ssid];
			}
			return false;
		},
		getVars	: function( ssid ) {
			if( !ssid ) ssid = _functions.sessionId();
			if( ssid in _sessions ) {
				return _sessions[ssid].vars;
			}
			return false;
		}
	};
	var _privateFunctions	= [ /* 'getSession' */ ];
	var publicObject	= {};
	var i;
	for( i in _functions )
		if( _privateFunctions.indexOf(i) === -1 ) publicObject[i]	= _functions[i];
	publicObject.sessionId();
	return publicObject;
};
