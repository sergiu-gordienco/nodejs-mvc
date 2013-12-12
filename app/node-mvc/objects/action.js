module.exports	= function( actionName, controllerName, options, appInstance ) {
	var _config	= {
		"public"	: false,
		"capture"	: function( request, controllerName, actionName, appInstance ) {

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
		isPublic	: function() {
			return !!(_config.public);
		},
		run			: function() {
			var e = true;
			try {
				(_config.capture)( appInstance.getRequest(), controllerName, actionName, appInstance );
			} catch(e) {
				appInstance._events.onError(e);
			}
			return e;
		}
	};
};