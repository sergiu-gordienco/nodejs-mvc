module.exports	= function( controllerName, options ) {
	var _config	= {};
	var _views	= {};
	var _actions	= {};
	_config.controllerName	= controllerName;

	// options._onAction( actionName, controllerObject );
	// options._noAction( actionName, controllerObject );
	// console.log(configObject);
	var controllerPublic	= {
		getView	: function( viewName ) {
			if( _functions.isValidIdentifier( viewName ) && viewName in _views ) {
				return _views[viewName];
			}
			return null;
		},
		getAction	: function( actionName ) {
			if( _functions.isValidIdentifier( actionName ) && actionName in _actions ) {
				return _actions[actionName];
			}
			return null;
		},
		actionExists	: function( actionName ) {
			return ( _functions.isValidIdentifier( actionName ) && actionName in _actions );
		},
		addAction	: function( actionName, options ) {
			if( _functions.isValidIdentifier( actionName ) && !controllerObject.actionExists( actionName ) ) {
				_actions[actionName]	= new actionInstance( actionName, options );
				return true;
			}
			return false;
		},
		removeAction	: function( actionName, options ) {
			if( controllerObject.actionExists( actionName ) ) {
				delete	_actions[actionName];
				return true;
			}
			return false;
		}
	};
};