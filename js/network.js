function Network() {

	this.onConnected = function() {};
	this.onDisconnected = function() {};
	this.onObjectReceived = function() {};
	this.onObject = function(object) {};
	
	this.send = function(user, object) {
		console.log("Send " + user + ": " + object);
		this.onObject(object);
	};

	this.connect = function() {
		this.onConnected();
	};
}