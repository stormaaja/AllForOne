/*
 *
 * All for One (c) by FGJ15 JKL Team for All for One
 *
 * All for One is licensed under a
 * Creative Commons Attribution-ShareAlike 3.0 Unported License.
 * 
 * You should have received a copy of the license along with this
 * work.  If not, see <http://creativecommons.org/licenses/by-sa/3.0/>.
 *
*/

function Network() {
	this.server = "http://127.0.1.2:1233";

	this.onConnected = function() {};
	this.onDisconnected = function() {};
	this.onObjectReceived = function() {};
	this.onObjectSent = function(object) {};
	this.onStateReceived = function(state) {};
	this.nick = "anonymous";
	
	this.send = function(user, object) {
		console.log("Send " + user + ": " + object);
		this.onObjectSent(object);
	};

	this.connect = function() {
		this.onConnected();
	};

	this.checkState = function(nick) {
		var network = this;
		$.get(this.server + "/state/" + this.nick, function(data) {
			network.onStateReceived(JSON.parse(data));
		});
	};
}