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

function Player(nick, x, y) {
	this._player = this;
	this.nick = nick;
	this.x = x;
	this.y = y;
	this.selected = false;
	
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
			this.castle.shadowBlur = 20;
			this.castle.shadowColor = "blue";
		} else {
			this.castle.shadowBlur = 0;
			this.castle.shadowColor = "";
		}
		return this.selected;
	};

	this.toggleSelected = function() {
		return this.setSelected(!this.selected);
	};

	this.castle = $("canvas").drawArc({
		layer: true,
		fillStyle: "green",
		x: x, y: y,
		radius: 50,
		
		selectable: true,
		click: function(layer) {
			if (!layer.selectable)
				return;
			layer.player.clicked();			
		}
	}).getLayer(-1);
	this.castle.player = this;
}