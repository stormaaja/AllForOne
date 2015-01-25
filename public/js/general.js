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
	$.checkEventsInterval = 10000;
	$.players = [];
	$.king = undefined;
	$.resourceFixes = { "gold": 100, "wood": 50, "diamonds": 5, "food": 100 };
	$.resourceConsumptionMultipliers = { "gold": 2, "wood": 4, "diamonds": 6 };
	$.resourceConsumptionFixesForMoney = { "food": 1.0, "wood": 1.5, "diamonds": 6.0 };
	$.resourceIcons = { "gold": "images/coin.png", "diamonds": "images/diamond.png", "food": "images/food.png", "wood": "images/wood.png" };

	$.events = [ { "probability": 10.0, "name": "Bandits", eventFunction: function() { bandidosFunction() } }];
	$.winningEvents = [ { "name": "Win by diamonds", checkTerms: function() { checkDiamondsWin(); } }];
	$.losingEvents = [ { "name": "Lose by starve", checkTerms: function() { checkStarving(); } }];

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
	$('#buttonSetResourceRatios').click(function() {
		balanceResourceGens();
	});

/*
	$.each($('.resourceGen'), function(index, value) {
		$(value).change(function() {
			balanceResourceGens($(this));
		});
	});
*/

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

		setInterval(function() {
			$.each($.events, function() {
				var prop = Math.random() * 100;
				if (prop < this.probability)
					this.eventFunction();
			});
		}, $.checkEventsInterval);
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

	calculateResourceRatios();
	refreshStats();
	refreshResources();

	$(".dropdown-menu li a").click(function(){
		$('#dropdownClass').data('selectedClass', $(this).data('value'));
		$('#dropdownMenuClass').text($(this).text());
   	});

   	$('#username').prop('value', $.player.nick);
   	$('#dropdownClass').data('selectedClass', $.player.customResource);

   	$('button').click(function() {
   		if ($(this).hasClass('upgradeButton'))
   			$('#upgradeSound1')[0].play();
   		else
   			$('#clickSound')[0].play();
   	})
});

function bandidosFunction() {
	if ($.player === undefined)
		return;
	$('canvas').drawImage( {
		source: 'images/bandidos.png',
		layer: true,
		x: $.player.castle.x - 100,
		y: $.player.castle.y,
	} );
	$('canvas').animateLayer(-1, {
		x: $.player.castle.x
	}, 10000, function(layer) {
		var percent = 45.0 - $.player.stats["defences"] * 10;
		if (percent < 0.0)
			return;
		$.player.resources["gold"] -= Math.floor($.player.resources["gold"] * (percent / 100.0));
		$.player.resources["food"] -= Math.floor($.player.resources["food"] * (percent / 100.0));
		$.player.resources["wood"] -= Math.floor($.player.resources["wood"] * (percent / 100.0));
		$.player.resources["diamonds"] -= Math.floor($.player.resources["diamonds"] * (percent / 100.0));
		$('canvas').removeLayer(layer);
	})
}

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
					if ($.player.nick !== this.nick) {
						var player = new Player(this.nick, (($.players.length + 1) % 4) * 200 + 150, (($.players.length + 1) / 4) * 200 + 100, this.playertype);
						$.players[$.players.length] = player;
						if (this.playertype === "king")
							$.king = player;

					}
				});
			} else if (this["operation"] === "refresh_needed") {
				location.reload();
			} else if (this["operation"] === "resource_update") {
				var player = findPlayer(this.from);
				if (player !== undefined)
					player.resources = this.resources;
			}
		});
	};
	$.network.connect($.player.nick, $.player.customResource);
}

function findPlayer(nick) {
	var player = undefined;
	$.each($.players, function() {
		if (this.nick === nick) {
			player = this;
		}
	});
	return player;
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

function balanceResourceGens() {
	var resourcesLeft = $.maxResources;
	$('.resourceGen').each(function() {
		resourcesLeft -= valueToInt($(this));
		if (resourcesLeft < 0)
			$(this).prop('value', '0');
	});
	
	calculateResourceRatios();
	refreshStats();
}

function balanceResourceGens_depr(inputChanged) {
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
	calculateResourceRatios();
	refreshStats();
}

function valueToInt(input) {
	return parseInt(input.prop('value'));
}

function transferResources(castleDestination, resources) {
	$('canvas').drawImage({
		source: 'images/caravan.png',
		layer: true,
		x: $.player.x, y: $.player.y,
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
	$.player.consumptionRates["gold"] = $.player.productionRates["food"] * $.resourceConsumptionFixesForMoney["food"]
		+ $.player.productionRates["wood"] * $.resourceConsumptionFixesForMoney["wood"]
		+ $.player.productionRates["diamonds"] * $.resourceConsumptionFixesForMoney["diamonds"];
	var consumption = valueToInt($('#resourcePercentGold')) * 2.0;
	if ($.player.customResource === "wood")
		consumption += (valueToInt($('#resourcePercentWood')) * 4.0);
	else
		consumption += (valueToInt($('#resourcePercentDiamonds')) * 6.0);
	
	$.player.consumptionRates["food"] = Math.floor(consumption / 10.0);
}

function increaseResources() {
//	calculateResourceRatios();
	/*
	$('.resourceGen').each(function() {
		var resourceType = $(this).data('resourceType');
		$.player.resources[resourceType] += $.player.productionRates[resourceType];
	});
	*/
	$.player.resources["food"] += $.player.productionRates["food"] - $.player.consumptionRates["food"];
//	$.goldConsumption = Math.round((valueToInt($('#resourcePercentFood')) / 100.0) * $.resourceFixes["food"] * $.player.stats["production"]);
	$.player.resources["gold"] += $.player.productionRates["gold"] - $.player.consumptionRates["gold"];
	refreshResources();
	$.localStorage.set("player", $.player.simplify());
	if ($.king !== undefined) {
		$.network.send($.king.nick, { "operation": "resource_update", "resources": $.player.resources, "from": $.player.nick });
	}
	$.each($.winningEvents, function() {
		this.checkTerms();
	});
	$.each($.losingEvents, function() {
		this.checkTerms();
	});
}

function setInfo(player) {
	if (player === undefined) {
		$('#playerInfo').hide();
	} else {
		$('#playerInfo').show();
		$('#otherPlayerName').text(player.nick);
		$('#otherPlayerGold').text(player.resources["gold"]);
		$('#otherPlayerFood').text(player.resources["food"]);
		$('#otherPlayerWood').text(player.resources["wood"]);
		$('#otherPlayerDiamonds').text(player.resources["diamonds"]);
	}
}

function refreshResources() {
	$('.resourceCount').each(function() {
		$(this).text($.player.resources[$(this).data('resourceType')]);
	});
}

function refreshStats() {
	$('#foodConsumptionValue').text($.player.consumptionRates["food"]);
	$('#goldConsumptionValue').text($.player.consumptionRates["gold"]);
	$('.playerStat').each(function() {
		$(this).text($.player.stats[$(this).data('statType')]);
	});
}

function generateNick() {
	return "anon" + Math.floor(Math.random() * 100000);
}

function checkDiamondsWin() {
	if ($.player.customResource === "king" && $.player.resources["diamonds"] > 1000)
		alert("Congrats. You win.");
}

function checkStarving() {
	if ($.player.resources["food"] < 0) {
		alert("Your people died starving. Let's try again.");
		$.player.stats = { "production": 1, "defences": 0, "caravans": 1 };
		$.player.productionRates = { "gold": 0, "diamonds": 0, "wood": 0, "food": 0 };
		$.player.consumptionRates = { "gold": 0, "diamonds": 0, "wood": 0, "food": 0 };
		$.player.resources = { "gold": 1000, "diamonds": 0, "wood": 750, "food": 200 };
		refreshStats();
		refreshResources();
	}
}