module.exports	= function( actionName, controller, options, appInstance ) {
	var _config	= {
		"public"	: false,
		"capture"	: function( request, response, appInstance, controller, action ) {

		}
	};
	if( typeof(options) === "object" ) {
		if( "public" in options ) {
			_config.public	= !!options.public;
		}

		if( "capture" in options && typeof(options.capture) === "function" ) {
			_config.capture	= options.capture;
		}
	}
	var actionObject	= {
		getController	: function() {
			return controller;
		},
		getName	: function() {
			return actionName;
		},
		isPublic	: function() {
			return !!(_config.public);
		},
		run			: function( request, response ) {
			var e = true;
			try {
				(_config.capture)( request, response, appInstance, controller, actionObject );
			} catch(e) {
				appInstance._events.onError(e);
			}
			return e;
		}
	};
	return actionObject;
};