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

$(document).ready(function() {
	$.server = "http://127.0.1.1:1233"
	$.fps = 30;
	$.movingObjects = [];

	//ar socket = new WebSocket("ws://localhost/socketserver", "multimanager");

	addCastle(100, 100);
	addCastle(500, 100);
	addCastle(300, 500);

	$('#sendResources').click(function() { 
		var layers = $('canvas').getLayers(function(layer) {
			return (layer.selected === true);
		});
		if (layers.length == 2) {
			$.post( $.server + "/transfer",
				{
					"to": "0",
					"from": "1"
				},
				function(data) {
					console.log(data);
					animateTransferResources(layers[0], layers[1]);
				}
			).fail(function() {
				alert( "error" );
			});
		}
	});
});

function animateTransferResources(castleFrom, castleDestination) {
	$('canvas').drawRect({
		layer: true,
		fillStyle: '#000',
		x: castleFrom.x, y: castleFrom.y,
		width: 25,
		height: 25
	});

	$('canvas').animateLayer(-1, {
			x: castleDestination.x,
			y: castleDestination.y
		}, 10000, function(layer) {
			$(this).removeLayer(layer);
			$('canvas').drawLayers();
		});
}

function addCastle(x, y) {
	$("canvas").drawArc({
		layer: true,
		fillStyle: "green",
		x: x, y: y,
		radius: 50,
		selected: false,
		click: function(layer) {
			layer.selected = !layer.selected;
			if (layer.selected) {
				layer.shadowBlur = 20;
				layer.shadowColor = "blue";
			} else {
				layer.shadowBlur = 0;
				layer.shadowColor = "";
			}
			$('canvas').drawLayers();
		}
	});
}