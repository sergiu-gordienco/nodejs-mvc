module.exports	= function( actionName, options ) {
	var _config	= {
		"public"	: false
	};
	var actionObject	= {
		isPublic	: function() {
			return !!(_config.public);
		}
	};
};