var actionInstance		= require('./action');

module.exports	= function( controllerName, options, appInstance ) {
	var _config	= {};
	var _views	= {};
	var _actions	= {};
	_config.controllerName	= controllerName;

	// options._onAction( actionName, controllerObject );
	// options._noAction( actionName, controllerObject );
	// console.log(configObject);
	var controllerObject	= {
		getView	: function( viewName ) {
			if( appInstance._functions.isValidIdentifier( viewName ) && viewName in _views ) {
				return _views[viewName];
			}
			return null;
		},
		getAction	: function( actionName ) {
			if( appInstance._functions.isValidIdentifier( actionName ) && actionName in _actions ) {
				return _actions[actionName];
			}
			return null;
		},
		actionExists	: function( actionName ) {
			return ( appInstance._functions.isValidIdentifier( actionName ) && actionName in _actions );
		},
		addAction	: function( actionName, options ) {
			console.log('##actionAdding',actionName);
			if( appInstance._functions.isValidIdentifier( actionName ) && !controllerObject.actionExists( actionName ) ) {
				console.log('##actionAdded',actionName);
				_actions[actionName]	= new actionInstance( actionName, controllerName, options, appInstance );
				return _actions[actionName];
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
	return controllerObject;
};