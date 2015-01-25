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
	$.resourceGenInterval = 10000;
	$.checkStateInterval = 1000;
	$.players = [];
	$.resourceFixes = { "gold": 100, "wood": 50, "diamonds": 5, "food": 100 };
	$.resourceConsumptionMultipliers = { "gold": 2, "wood": 4, "diamonds": 6 };
	$.resourceIcons = { "gold": "images/coin.png", "diamonds": "images/diamond.png", "food": "images/food.png", "wood": "images/wood.png" };
	var firstTime = true;

	if ($.localStorage.isSet("player")) {
		var player = $.localStorage.get("player");
		$.player = new Player(player.nick, 100, 100, player.customResource);
		$.player.resources = player.resources;
		$.player.stats = player.stats;
		firstTime = false;
	} else {
		$.player = new Player(generateNick(), 100, 100, Math.round(Math.random() * 2) == 0 ? "diamonds" : "woods");
		$('#buttonUserSettings').click();
	}
	$.player.castle.selectable = false;

	$('#sendResources').click(function() { 
		if ($.sendTo === undefined || $.player.stats["caravans"] === 0) {
			return;
		}
		else {
			resources = {};
			$('.sendInput').each(function() {
				var key = $(this).data('resourceType');
				var amount = valueToInt($(this));
				if (amount > 0 && amount <= $.player.resources[key]) {
					resources[key] = amount;
					$.player.resources[key] -= amount;
					$(this).prop('value', 0);
				}
			});

			if (Object.size(resources) > 0) {
				refreshResources();
				transferResources($.sendTo, resources);
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

	if (!firstTime) {
		setInterval(function() {
			increaseResources();
		}, $.resourceGenInterval);

		setInterval(function() {
			$.network.checkState($.player);
		}, $.checkStateInterval);
	}

	if ($.player.customResource === "wood")
		$('.resourceDiamonds').remove();
	else
		$('.resourceWood').remove();

	$('#buttonSave').click(function() {
		$.player.customResource = $('#dropdownClass').data('selectedClass');
		$.player.nick = $('#username').prop('value');
		$.localStorage.set("player", $.player.simplify());
		location.reload();
	});

	if (!firstTime)
		connectToServer();

	refreshStats();
	refreshResources();

	$(".dropdown-menu li a").click(function(){
		$('#dropdownClass').data('selectedClass', $(this).data('value'));
		$('#dropdownMenuClass').text($(this).text());
   	});

   	$('#username').prop('value', $.player.nick);
   	$('#dropdownClass').data('selectedClass', $.player.customResource);
   	calculateResourceRatios();
});

function connectToServer() {
	$.network = new Network();
	$.network.nick = $.player.nick;
	$.network.onConnected = function() {
		
	}
	$.network.onStateReceived = function(state) {
		$(state).each(function() {
			if (this["operation"] === "transfer") {
				var index = 0;
				$.each(this.resources, function(key, value) {
					$.player.resources[key] += value;
					createReceivedIndicator($.player, key, index++);
				});
				refreshResources();
			} else if (this["operation"] === "playerlist") {
				$($.players).each(function() {
					$('canvas').removeLayer(this.castle);
				});
				$.players = [];
				$.each(this.players, function() {
					if ($.player.nick !== this.nick)
						$.players[$.players.length] = new Player(this.nick, (($.players.length + 1) % 4) * 200 + 150, (($.players.length + 1) / 4) * 200 + 100, this.playertype);
				});
			} else if (this["operation"] === "refresh_needed") {
				location.reload();
			}
		});
	};
	$.network.connect($.player.nick, $.player.customResource);
}

function createReceivedIndicator(player, resource, index) {
	$('canvas').drawImage({
		source: $.resourceIcons[resource],
		layer: true,
		x: player.castle.x,
		y: player.castle.y
	});
	$('canvas').animateLayer(-1, {
		y: player.castle.y - 50,
		x: player.castle.x + 30 * index - 30
	}, 2000, function(layer) { $('canvas').removeLayer(layer); });
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
			// $('#' + $(this).data('resourceValueHolder')).text((Math.round(res / 100.0) * $.resourceFixes[$(this).data('resourceType')] * $.player.stats["production"]));
			$('#' + $(this).data('resourceValueHolder')).text(res);
		}

	});
	refreshStats();
	calculateResourceRatios();
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
	$.player.stats["caravans"] -= 1;
	refreshStats();

	$('canvas').animateLayer(-1, {
			x: castleDestination.x,
			y: castleDestination.y
		}, 10000,
		function(layer) {
			$('canvas').animateLayer(layer, {
				x: $.player.x,
				y: $.player.y
			}, 10000, function(layer) {
				$.network.send($.sendTo.nick, { "operation": "transfer", "resources": resources, "from": $.player.nick });
				$(this).removeLayer(layer);
				$(this).drawLayers();
				$.player.stats["caravans"] += 1;
				refreshStats();
			})
		});
}

function calculateResourceRatios() {
	$('.resourceGen').each(function() {
		var resourceType = $(this).data('resourceType');
		$.player.productionRates[resourceType] = Math.round((valueToInt($(this)) / 100.0) * $.resourceFixes[resourceType] * $.player.stats["production"]);
		$('#' + $(this).data('resourceValueHolder')).text($.player.productionRates[resourceType]);
	});
}

function increaseResources() {
	calculateResourceRatios();
	$('.resourceGen').each(function() {
		var resourceType = $(this).data('resourceType');
		$.player.resources[resourceType] += $.player.productionRates[resourceType];
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
	$('.playerStat').each(function() {
		$(this).text($.player.stats[$(this).data('statType')]);
	});
}

function generateNick() {
	return "anon" + Math.floor(Math.random() * 100000);
}