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

function Player(nick, x, y, nodeType) {
	this._player = this;
	this.nick = nick;
	this.x = x;
	this.y = y;
	this.selected = false;
	this.customResource = nodeType;
	this.stats = { "production": 1, "defences": 0, "caravans": 1 };
	
	this.resources = { "gold": 0, "diamonds": 0, "wood": 0, "food": 0 };

	this.clicked = function() {
		if ($.sendTo !== undefined && $.sendTo !== this)
			$.sendTo.toggleSelected();
		this.toggleSelected();
		if (this.selected)
			$.sendTo = this;
		else
			$.sendTo = undefined;
		
		$('canvas').drawLayers();
	};

	this.setSelected = function(val) {
		this.selected = val;
		if (this.selected) {

		} else {

		}
		return this.selected;
	};

	this.toggleSelected = function() {
		return this.setSelected(!this.selected);
	};
	var townImage = "";
	if (this.customResource === "king")
		townImage = 'images/city.png';
	else if (this.customResource === "diamonds")
		 townImage = 'images/town_sand.png';
	else
		townImage = 'images/town_wood.png';

	this.castle = $("canvas").drawImage({
		source: townImage,
		layer: true,
		x: x, y: y,	
		selectable: true,
		click: function(layer) {
			if (!layer.selectable)
				return;
			layer.player.clicked();			
		}
	}).getLayer(-1);
	this.castle.player = this;

	this.simplify = function() {
		return { "resources": this.resources, "nick": this.nick, "customResource": this.customResource };
	}
}