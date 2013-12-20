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
module.exports	= function( req, res, app ) {
	var _functions = {
		ip	: function() {
			return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
		},
		hashSession		: function( session ) {
			return ""+app._classes.crypto.SHA256(session);
		},
		genSessionId	: function() {
			return _functions.ip()+'-'+new Date().valueOf()+'-'+Math.floor(Math.random()*1000000000)+'-'+Math.floor(Math.random()*1000000000);
		},
		sessionId	: function() {
			var ssid	= false;
			ssid	= req.cookies.get('ssid');
			if( !ssid ) {
				ssid	= _functions.hashSession(_functions.genSessionId());
				req.cookies.set( 'ssid', ssid );
			}
			if( !( ssid in _sessions ) ) {
				var t = new Date().valueOf();
				_sessions[ssid]	= {
					created	: t,
					expire	: t+600000,
					vars	: {}
				};
			}
			return ssid;
		},
		setExpire		: function( secconds, ssid ) {
			if( !ssid ) ssid = false;
			var session	= _functions.getSession(ssid);
			if( session ) {
				session.expire	= new Date().valueOf() + ( secconds || 0 ) * 1000;
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
	var _privateFunctions	= [ 'getSession' ];
	var publicObject	= {};
	var i;
	for( i in _functions )
		if( _privateFunctions.indexOf(i) === -1 ) publicObject[i]	= _functions[i];
	return publicObject;
};
