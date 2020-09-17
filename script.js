var savedLocations = [];
var currentLocation;
function initialize() {
    //Take the  previous locations from local storage
    savedLocations = JSON.parse(localStorage.getItem("weather"));
    //display previous searches from local storage
    if (savedLocations) {
        //get the last city searched so we can display it
        currentLocation = savedLocations[savedLocations.length - 1];
        showPrevious();
        getCurrent(currentLocation);
    }
    else {
        //try to geolocate, otherwise set city to raleigh
        if (!navigator.geolocation) {
            //can't geolocate and no previous searches, so just give them one
            getCurrent("New york");
        }
        else {
            navigator.geolocation.getCurrentPosition(success, error);
        }
    }
}
function success(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&APPID=846c51800489cd6a062d23f85a4d24c8";
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        currentLocation = response.name;
        saveLocation(response.name);
        getCurrent(currentLocation);
    });
}
function error() {
    //Giving a previous search since there isn't one
    currentLocation = "New york"
    getCurrent(currentLocation);
}
function showPrevious() {
    //show the previous searched for locations based on what is in local storage
    if (savedLocations) {
        $("#previousSearches").empty();
        var Btns = $("<div>").attr("class", "list-group");
        for (var i = 0; i < savedLocations.length; i++) {
            var localBtn = $("<a>").attr("href", "#").attr("id", "local-btn").text(savedLocations[i]);
            if (savedLocations[i] == currentLocation) {
                localBtn.attr("class", "list-group-item list-group-item-action active");
            }
            else {
                localBtn.attr("class", "list-group-item list-group-item-action");
            }
            Btns.prepend(localBtn);
        }
        $("#previousSearches").append(Btns);
    }
}
function getCurrent(city) {
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&APPID=846c51800489cd6a062d23f85a4d24c8";
    $.ajax({
        url: queryURL,
        method: "GET",
        error: function () {
            savedLocations.splice(savedLocations.indexOf(city), 1);
            localStorage.setItem("weather", JSON.stringify(savedLocations));
            initialize();
        }
    }).then(function (response) {
        //created a  card
        var currentCard = $("<div>").attr("class", "card bg-light");
        $("#forecast").append(currentCard);
        //add location to card
        var currentCardHead = $("<div>").attr("class", "card-header").text("Current weather for " + response.name);
        currentCard.append(currentCardHead);
        var cardRow = $("<div>").attr("class", "row no-gutters");
        currentCard.append(cardRow);
        //get icon for weather conditions
        var iconURL = "https://openweathermap.org/img/wn/" + response.weather[0].icon + "@2x.png";
        var imgDiv = $("<div>").attr("class", "col-md-4").append($("<img>").attr("src", iconURL).attr("class", "card-img"));
        cardRow.append(imgDiv);
        var textDiv = $("<div>").attr("class", "col-md-8");
        var cardBody = $("<div>").attr("class", "card-body");
        textDiv.append(cardBody);
        //display city name
        cardBody.append($("<h3>").attr("class", "card-title").text(response.name));
        //display last updated
        var currentDate = moment(response.dt, "X").format("dddd, MMMM Do YYYY, h:mm a");
        cardBody.append($("<p>").attr("class", "card-text").append($("<small>").attr("class", "text-muted").text("Last updated: " + currentDate)));
        //display Temperature
        cardBody.append($("<p>").attr("class", "card-text").html("Temperature: " + response.main.temp + " &#8457;"));
        //display Humidity
        cardBody.append($("<p>").attr("class", "card-text").text("Humidity: " + response.main.humidity + "%"));
        //display Wind Speed
        cardBody.append($("<p>").attr("class", "card-text").text("Wind Speed: " + response.wind.speed + " MPH"));
        //get UV Index
        var uvURL = "https://api.openweathermap.org/data/2.5/uvi?appid=7e4c7478cc7ee1e11440bf55a8358ec3&lat=" + response.coord.lat + "&lon=" + response.coord.lat;
        $.ajax({
            url: uvURL,
            method: "GET"
        }).then(function (uvresponse) {
            var uvindex = uvresponse.value;
            var bgcolor;
            if (uvindex <= 3) {
                bgcolor = "green";
            }
            else if (uvindex >= 3 || uvindex <= 6) {
                bgcolor = "yellow";
            }
            else if (uvindex >= 6 || uvindex <= 8) {
                bgcolor = "orange";
            }
            else {
                bgcolor = "red";
            }
            var uvCheck = $("<p>").attr("class", "card-text").text("UV Index: ");
            uvCheck.append($("<span>").attr("class", "uvindex").attr("style", ("background-color:" + bgcolor)).text(uvindex));
            cardBody.append(uvCheck);
        });
        cardRow.append(textDiv);
        getForecast(response.id);
    });
}
function getForecast(city) {
    //get 5 day forecast
    var queryURL = "https://api.openweathermap.org/data/2.5/forecast?id=" + city + "&APPID=846c51800489cd6a062d23f85a4d24c8";
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        //add container div for forecast cards
        var addRow = $("<div>").attr("class", "forecast");
        $("#forecast").append(addRow);
        //loop through array response to find the forecasts for 15:00
        for (var i = 0; i < response.list.length; i++) {
            if (response.list[i].dt_txt.indexOf("15:00:00") !== -1) {
                var addCol = $("<div>").attr("class", "one-fifth");
                addRow.append(addCol);
                var addCard = $("<div>").attr("class", "card text-white bg-primary");
                addCol.append(addCard);
                var cardHead = $("<div>").attr("class", "card-header").text(moment(response.list[i].dt, "X").format("MMM Do"));
                addCard.append(cardHead);
                var cardImg = $("<img>").attr("class", "card-img-top").attr("src", "https://openweathermap.org/img/wn/" + response.list[i].weather[0].icon + "@2x.png");
                addCard.append(cardImg);
                var bodyDiv = $("<div>").attr("class", "card-body");
                addCard.append(bodyDiv);
                bodyDiv.append($("<p>").attr("class", "card-text").html("Temp: " + response.list[i].main.temp + " &#8457;"));
                bodyDiv.append($("<p>").attr("class", "card-text").text("Humidity: " + response.list[i].main.humidity + "%"));
            }
        }
    });
}
function clear() {
    //clear weather history
    $("#forecast").empty();
}
function saveLocation(location) {
    // saved locations array
    if (savedLocations === null) {
        savedLocations = [location];
    }
    else if (savedLocations.indexOf(location) === -1) {
        savedLocations.push(location);
    }
    //save the new array to localstorage
    localStorage.setItem("weather", JSON.stringify(savedLocations));
    showPrevious();
}
$("#searchBtn").on("click", function () {
    //don't refresh the screen
    event.preventDefault();
    //grab the value
    var location = $("#searchInput").val().trim();
    //if location wasn't empty
    if (location !== "") {
        //clear the previous weather
        clear();
        currentLocation = location;
        saveLocation(location);
        //clear the search
        $("#searchInput").val("");
        //get the new weather update
        getCurrent(location);
    }
});
$(document).on("click", "#local-btn", function () {
    clear();
    currentLocation = $(this).text();
    showPrevious();
    getCurrent(currentLocation);
});
initialize();