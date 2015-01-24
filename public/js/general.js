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

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key))
			size++;
    }
    return size;
};

$(document).ready(function() {
	$.maxResources = 15;
	$.resourceGenInterval = 3000;
	$.players = [];

	$.customResource = "diamonds";

	$.player = new Player("user", 100, 100);
	$.player.castle.selectable = false;

	$.players[0] = new Player("user2", 500, 100);
	$.players[1] = new Player("user3", 300, 500);

	$('#sendResources').click(function() { 
		if ($.sendTo === undefined) {
			return;
		}
		else {
			resources = {};
			$('.sendInput').each(function() {
				var key = $(this).data('resourceType');
				var amount = valueToInt($(this));
				if (amount > 0) {
					resources[key] = amount;
					$.player.resources[key] -= amount;
					$(this).prop('value', 0);
				}
			});

			if (Object.size(resources) > 0) {
				refreshResources();
				transferResources($.sendTo, resources);
				$.network.send($.sendTo.nick, resources);
			}
		}
	});

	$.each($('.resourceGen'), function(index, value) {
		$(value).change(function() {
			balanceResourceGens($(this));
		});
	});

	$('.sendInput').change(function() {
		var val = valueToInt($(this));
		var key = $(this).data('resourceType');
		if (val > 0 && val > $.player.resources[key])
			$(this).prop('value', val - 1);
	});

	setInterval(function() {
			increaseResources();
	}, $.resourceGenInterval);

	if ($.customResource === "wood")
		$('.resourceDiamonds').remove();
	else
		$('.resourceWood').remove();

	$('#buttonSave').click(function() {
		connectToServer();
	});

	connectToServer();

	//$('#buttonUserSettings').click();

});

function connectToServer() {
	$.network = new Network();
	$.network.onConnected = function() {
		$('#buttonCloseSettingsDialog').click();
	}
	$.network.connect();
}


function showError(message, object) {
	alert(message);
}

function balanceResourceGens(inputChanged) {
	var resourcesLeft = $.maxResources - valueToInt(inputChanged);
	var inputsLeft = 2;
	var resourceType = inputChanged.data('resourceType');
	console.log(resourceType);
	$('.resourceGen').each(function() {
		if ($(this).data('resourceType') !== resourceType) {
			var res = Math.round(resourcesLeft / inputsLeft);
			$(this).prop('value', res);
			resourcesLeft = resourcesLeft - res;
			inputsLeft--;
		}

	});
}

function valueToInt(input) {
	return parseInt(input.prop('value'));
}

function transferResources(castleDestination, resources) {
	$('canvas').drawRect({
		layer: true,
		fillStyle: '#000',
		x: $.player.x, y: $.player.y,
		width: 25,
		height: 25
	});

	$('canvas').animateLayer(-1, {
			x: castleDestination.x,
			y: castleDestination.y
		}, 10000,
		function(layer) {
			$('canvas').animateLayer(layer, {
				x: $.player.x,
				y: $.player.y
			}, 10000, function(layer) {
				$(this).removeLayer(layer);
				$(this).drawLayers();
			})
		});
}

function increaseResources() {
	$('.resourceGen').each(function() {
		var resourceType = $(this).data('resourceType');
		$.player.resources[$(this).data('resourceType')] += valueToInt($(this));
		$("span[data-resource-type='" + resourceType + "']").text($.player.resources[resourceType]);
	});
}

function refreshResources() {
	$('.resourceCount').each(function() {
		$(this).text($.player.resources[$(this).data('resourceType')]);
	});
}