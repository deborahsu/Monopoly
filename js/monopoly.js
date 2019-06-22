//Variables initialization
var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 10;
Monopoly.doubleCounter = 0;

//Game initialization
Monopoly.init = function () {
    $(document).ready(function () {
        Monopoly.adjustBoardSize();
        $(window).bind("resize", Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();
    });
};

//Game start with intro message
Monopoly.start = function () {
    Monopoly.showPopup("intro")
};

//function rolling dices

Monopoly.initDice = function () {
    $(".dice").click(function () {
        if (Monopoly.allowRoll) {
            Monopoly.rollDice();
        }
    });
};

//Assign the turn to the player
Monopoly.getCurrentPlayer = function () {

    return $(".player.current-turn");
};

//Moves the player to the closest cell
Monopoly.getPlayersCell = function (player) {
    return player.closest(".cell");
};


//function returning the amount of money for the palyer
Monopoly.getPlayersMoney = function (player) {
    return parseInt(player.attr("data-money"));
};

//function calculating the player's money and in case the player has no moeny has a pop-up message and a sound

Monopoly.updatePlayersMoney = function (player, amount) {
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;
    if (playersMoney < 0) {
        Monopoly.playSound("broke");
        Monopoly.showPopup("broke");
        // alert(player.attr("id") + ' is broke');
        player.addClass("broke");
    }
    player.attr("data-money", playersMoney);
    player.attr("title", player.attr("id") + ": $" + playersMoney);
    Monopoly.playSound("chaching");
};

//Dice launch function

Monopoly.rollDice = function () {
    var result1 = Math.floor(Math.random() * 6) + 1;
    var result2 = Math.floor(Math.random() * 6) + 1;
    $(".dice").find(".dice-dot").css("opacity", 0);
    $(".dice#dice1").attr("data-num", result1).find(".dice-dot.num" + result1).css("opacity", 1);
    $(".dice#dice2").attr("data-num", result2).find(".dice-dot.num" + result2).css("opacity", 1);
    var currentPlayer = Monopoly.getCurrentPlayer();
    if (currentPlayer == 'Player1') {
        result1 = 1;
        result2 = 2;
    }
    if (result1 == result2) {
        Monopoly.doubleCounter++;
        currentPlayer.addClass("double")
    }else{ 
        currentPlayer.is(".double")? currentPlayer.removeClass("double"):null;
    }
    
    Monopoly.handleAction(currentPlayer, "move", result1 + result2);
};

// function moving the player from cell to cell every 2ms

Monopoly.movePlayer = function (player, steps) {
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function () {
        if (steps == 0) {
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        } else {
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    }, 200);
};

//function setting the turn of the player
Monopoly.handleTurn = function () {
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    if (playerCell.hasClass(player.attr("id"))) {
        player.addClass("happyface");
    }

    if (playerCell.is(".available.property")) {
        Monopoly.handleBuyProperty(player, playerCell);
    } else if (playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))) {
        Monopoly.handlePayRent(player, playerCell);
    } else if (playerCell.is(".go-to-jail")) {
        Monopoly.handleGoToJail(player);
    } else if (playerCell.is(".chance")) {
        Monopoly.handleChanceCard(player);
    } else if (playerCell.is(".community")) {
        Monopoly.handleCommunityCard(player);
    }
    else {
        Monopoly.setNextPlayerTurn();
    }
}


// function changing the turn to the next player
Monopoly.setNextPlayerTurn = function () {
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player", ""));
    
        var nextPlayerId = playerId + 1;
        if (currentPlayerTurn.is(".broke")) {
            alert('player' + playerid + ' is broke so we are gonna skip to player ' + playerId++);
            playerId++;
        }else if(currentPlayerTurn.is(".double")){
            nextPlayerId=playerId;
        }else if(nextPlayerId > $(".player").length){
            nextPlayerId = 1;

    }
    
    currentPlayerTurn.removeClass("current-turn");
    var nextPlayer = $(".player#player" + nextPlayerId);
    
    nextPlayer.addClass("current-turn");
    if (nextPlayer.is(".jailed")) {
        var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
        currentJailTime++;
        nextPlayer.attr("data-jail-time", currentJailTime);
        if (currentJailTime > 3) {
            nextPlayer.removeClass("jailed");
            nextPlayer.removeAttr("data-jail-time");
        }
        Monopoly.setNextPlayerTurn();
        return;
    }
    Monopoly.closePopup();
    Monopoly.allowRoll = true;
};

// Function allowing the player to buy a property
Monopoly.handleBuyProperty = function (player, propertyCell) {
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click", function () {
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")) {
            Monopoly.handleBuy(player, propertyCell, propertyCost);
        } else {
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};

// Function asking the player to pay the rent of the other player'property

Monopoly.handlePayRent = function (player, propertyCell) {
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click", function () {
        var properyOwner = $(".player#" + properyOwnerId);


        Monopoly.updatePlayersMoney(player, currentRent);
        Monopoly.updatePlayersMoney(properyOwner, -1 * currentRent);
        Monopoly.closeAndNextTurn();
    });



    Monopoly.showPopup("pay");
};


// Function announcing the player that he has to go to jail

Monopoly.handleGoToJail = function (player) {
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click", function () {
        Monopoly.handleAction(player, "jail");
    });
    Monopoly.showPopup("jail");
    Monopoly.closePopup();
};

// Function ChanceCard (getting the chance message from the server)

Monopoly.handleChanceCard = function (player) {
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function (chanceJson) {
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", chanceJson["action"]).attr("data-amount", chanceJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("chance");
};


// Function CommunityCard (getting the community message from the server)
Monopoly.handleCommunityCard = function (player) {
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function (communityJson) {
        popup.find(".popup-content #text-placeholder").text(communityJson["content"]);
        popup.find(".popup-title").text(communityJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", communityJson["action"]).attr("data-amount", communityJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
    
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("community");
   
};


// Function sending the player to jail
Monopoly.sendToJail = function (player) {
    player.addClass("jailed");
    player.attr("data-jail-time", 1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};


Monopoly.getPopup = function (popupId) {
    return $(".popup-lightbox .popup-page#" + popupId);
};

Monopoly.calculateProperyCost = function (propertyCell) {
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group", "")) * 5;
    if (cellGroup == "rail") {
        cellPrice = 10;
    }
    return cellPrice;
};


Monopoly.calculateProperyRent = function (propertyCost) {
    return propertyCost / 2;
};


Monopoly.closeAndNextTurn = function () {
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

Monopoly.initPopups = function () {
    $(".popup-page#intro").find("button").click(function () {
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers", numOfPlayers)) {
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};


Monopoly.handleBuy = function (player, propertyCell, propertyCost) {
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost) {
        Monopoly.showErrorMsg();
    } else {
        Monopoly.updatePlayersMoney(player, propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
            .addClass(player.attr("id"))
            .attr("data-owner", player.attr("id"))
            .attr("data-rent", rent);
        Monopoly.setNextPlayerTurn();
    }
};



// function assigning an action to the player for each type of case

Monopoly.handleAction = function (player, action, amount) {
    switch (action) {
        case "move":
            Monopoly.movePlayer(player, amount);
            break;
        case "pay":
            Monopoly.updatePlayersMoney(player, amount);
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    Monopoly.closePopup();
};


// Monopoly.removeProperty = function (player) {
//     console.log("remove prop")

// }
// Monopoly.delete = function (player) {
//     player.removeClass("player");
//     Monopoly.removeProperty(player)
// }



// function creating Players
Monopoly.createPlayers = function (numOfPlayers) {
    var startCell = $(".go");
    for (var i = 1; i <= numOfPlayers; i++) {
        var player = $("<div />").addClass("player shadowed").attr("id", "player" + i).attr("title", "player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i == 1) {
            player.addClass("current-turn");
        }
        player.attr("data-money", Monopoly.moneyAtStart);
    }
};


Monopoly.getNextCell = function (cell) {
    var currentCellId = parseInt(cell.attr("id").replace("cell", ""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40) {
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};


Monopoly.handlePassedGo = function () {
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player, 1000/*Monopoly.moneyAtStart/-10*/);
};

// function validating the number of players
Monopoly.isValidInput = function (validate, value) {
    var isValid = false;
    switch (validate) {
        case "numofplayers":
            if (value > 1 && value <= 4) {
                isValid = true;
            }
    }

    if (!isValid) {
        Monopoly.showErrorMsg();
    }
    return isValid;

}

Monopoly.showErrorMsg = function () {
    $(".popup-page .invalid-error").fadeTo(500, 1);
    setTimeout(function () {
        $(".popup-page .invalid-error").fadeTo(500, 0);
    }, 2000);
};


Monopoly.adjustBoardSize = function () {
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(), $(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) * 2;
    $(".board").css({ "height": boardSize, "width": boardSize });
}

Monopoly.closePopup = function () {
    $(".popup-lightbox").fadeOut();
};


// Function allowing to play a sound
Monopoly.playSound = function (sound) {
    var snd = new Audio("./sounds/" + sound + ".wav");
    snd.play();
}

// Function showing a pop up recieving the id of the element as a parameter
Monopoly.showPopup = function (popupId) {
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();