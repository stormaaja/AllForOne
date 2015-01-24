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
	$.maxResources = 100;
	$.tax = 0;
	$.resourceGenInterval = 3000;
	$.checkStateInterval = 1000;
	$.players = [];
	$.resourceFixes = { "gold": 100, "wood": 50, "diamonds": 5, "food": 100 };
	$.resourceConsumptionMultipliers = { "gold": 2, "wood": 4, "diamonds": 6 };

	if ($.localStorage.isSet("player")) {
		var player = $.localStorage.get("player");
		$.player = new Player(player.nick, 100, 100, player.customResource);
		$.player.resources = player.resources;
		$.player.stats = player.stats;
	} else {
		$.player = new Player(generateNick(), 100, 100, Math.round(Math.random() * 2) == 0 ? "diamonds" : "woods");
	}
	$.player.castle.selectable = false;

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
				$.network.send($.sendTo.nick, { "operation": "transfer", "resources": resources, "from": $.player.nick });
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

	setInterval(function() {
		$.network.checkState($.player.nick);
	}, $.checkStateInterval);

	if ($.player.customResource === "wood")
		$('.resourceDiamonds').remove();
	else
		$('.resourceWood').remove();

	$('#buttonSave').click(function() {
		connectToServer();
	});

	connectToServer();

	//$('#buttonUserSettings').click();
	refreshStats();
	refreshResources();

});

function connectToServer() {
	$.network = new Network();
	$.network.nick = $.player.nick;
	$.network.onConnected = function() {
		$('#buttonCloseSettingsDialog').click();
	}
	$.network.onStateReceived = function(state) {
		$(state).each(function() {
			if (this["operation"] === "transfer") {
				$.each(this.resources, function(key, value) {
					$.player.resources[key] += value;
				});
				refreshResources();
			} else if (this["operation"] === "playerlist") {
				$($.players).each(function() {
					$('canvas').removeLayer(this.castle);
				});
				$.players = [];
				$.each(this.players, function() {
					if ($.player.nick !== this.nick)
						$.players[$.players.length] = new Player(this.nick, (($.players.length + 1) % 4) * 200 + 100, (($.players.length + 1) / 4) * 100 + 100, this.playertype);
				});
			}
		});
	};
	$.network.connect($.player.nick, $.player.customResource);
}


function showError(message, object) {
	alert(message);
}

function balanceResourceGens(inputChanged) {
	var resourcesLeft = $.maxResources - valueToInt(inputChanged);
	if (resourcesLeft > 100) {
		inputChanged.prop('value', 100);
		resourcesLeft = 0;
	} else if (resourcesLeft < 0) {
		inputChanged.prop('value', 100);
		resourcesLeft = 0;
	}
	$('#' + inputChanged.data('resourceValueHolder')).text(inputChanged.prop('value'));
	var inputsLeft = 2;
	var resourceType = inputChanged.data('resourceType');
	$('.resourceGen').each(function() {
		if ($(this).data('resourceType') !== resourceType) {
			var res = Math.round(resourcesLeft / inputsLeft);
			$(this).prop('value', res);
			resourcesLeft = resourcesLeft - res;
			inputsLeft--;
			$('#' + $(this).data('resourceValueHolder')).text(res);
		}

	});
	refreshStats();
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
		$.player.resources[resourceType] += Math.round((valueToInt($(this)) / 100.0) * $.resourceFixes[resourceType] * $.player.stats["production"]);
	});
	$.player.resources["food"] -= $.foodConsumption;
	$.goldConsumption = Math.round((valueToInt($('#resourcePercentFood')) / 100.0) * $.resourceFixes["food"] * $.player.stats["production"]);
	$.player.resources["gold"] -= $.goldConsumption;
	refreshResources();
	$.localStorage.set("player", $.player.simplify());
}

function refreshResources() {
	$('.resourceCount').each(function() {
		$(this).text($.player.resources[$(this).data('resourceType')]);
	});
}

function refreshStats() {
	var consumption = valueToInt($('#resourcePercentGold')) * 2.0;
	if ($.player.customResource === "wood")
		consumption += (valueToInt($('#resourcePercentWood')) * 4.0);
	else
		consumption += (valueToInt($('#resourcePercentDiamonds')) * 6.0);
	
	$.foodConsumption = Math.floor(consumption / 10.0);
	$('#foodConsumptionValue').text($.foodConsumption);
	$('#goldConsumptionValue').text($.goldConsumption);
}

function generateNick() {
	return "anon" + Math.floor(Math.random() * 100000);
}