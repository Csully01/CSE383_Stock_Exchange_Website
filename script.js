
var URL='https://api.polygon.io';
var exchange;
var stock;
var exchangeinfoJson
var stockinfoJson
var newsJson
var callType;

// Listeners
$('#dropdownNav a').on('click', function() {
  exchange = $(this).attr('value');
  getExchange(exchange);
  console.log(exchange);
});

$('#stock-dropdown-menu').on('click', 'a', function() {
  $('#ticker-listening').val(stock);
  $('#details-button').removeAttr('disabled');
  stock = $(this).attr('value');
  console.log(stock);
  // clear the table when a new stock is chosen
  $('#stock-info-table > tbody').empty();
  $('#stock-news').empty();
});

$('#details-button').on('click', function() {
  getStockInfo(stock);
  callType = "detail";
  if (stock) {
    $.ajax({
      url: URL + '/v2/aggs/ticker/' + stock + '/range/1/day/2023-05-02/2023-05-08',
      method: "GET",
      data: {
        apiKey: "hptM7CUVH3iVDTYlgjcV0r8MIwfHpSmH"
      }
    }).done(function(data) {
      console.log(data);
      // Display the data in a modal or a separate section of the page
    }).fail(function(error) {
      console.log("Error", error.statusText);
    });
  }
});

$('#get-news-button').click(function() {
  getStockNews(stock);
  callType = "news";
});



// Functions

// gets all of the stocks that belong to this exchange
function getExchange(exchange) {
  $.ajax({
    url: URL + '/v3/reference/tickers?market=stocks&exchange=' + exchange + '&active=true&limit=100&apiKey=hptM7CUVH3iVDTYlgjcV0r8MIwfHpSmH',
    method: "GET"
  }).done(function(data) {
    $("#stock-dropdown-menu").html(""); // clear previous options
    len = data.results.length;
    for (i=0; i<len; i++) {
      $("#stock-dropdown-menu").append('<a class="dropdown-item" href="#" value="' + data.results[i].ticker + '">' + data.results[i].name + ' (' + data.results[i].ticker + ')</a>');
    }
    exchangeinfoJson = data;
    console.log(exchangeinfoJson);
  }).fail(function(error) {
    console.log("Error", error.statusText);
  });
}
// gets all the information about the current stock
function getStockInfo(stock) {
  if (!stock) {
    console.log("Please select a stock");
    return;
  }

  // First AJAX request to get current stock info
  $.ajax({
    url: 'https://api.polygon.io/v2/aggs/ticker/' + stock + '/prev?adjusted=true&apiKey=hptM7CUVH3iVDTYlgjcV0r8MIwfHpSmH',
    method: "GET"
  }).done(function(data) {
    console.log(data);
    if (data.results && data.results.length > 0) {
      var lastPrice = data.results[0].c;
      var change = lastPrice - data.results[0].o;
      var changePercent = ((change / data.results[0].o) * 100).toFixed(2);
      var symbol = data.ticker;
      var volume = data.results[0].v;
      var volumeWeighted = data.results[0].vw;
      var openingPrice = data.results[0].o;
      var closingPrice = data.results[0].c;
      var highestPrice = data.results[0].h;
      var lowestPrice = data.results[0].l;
      var unixTimestamp = data.results[0].t;
      var tradesToday = data.results[0].n;
      var today = new Date();
      var endDate = today.toISOString().substring(0, 10);
      var startDate = new Date(today.getTime());
      
      // Subtract 1 day until we have 7 weekdays
      var numWeekdays = 0;
      while (numWeekdays < 7) {
        startDate.setDate(startDate.getDate() - 1);
        if (startDate.getDay() !== 0 && startDate.getDay() !== 6) {
          numWeekdays++;
        }
      }
      startDate = startDate.toISOString().substring(0, 10);
      
      // Second AJAX request to get closing stock prices for last 7 days
      $.ajax({
        url: 'https://api.polygon.io/v2/aggs/ticker/' + stock + '/range/1/day/' + startDate + '/' + endDate + '?adjusted=true&apiKey=hptM7CUVH3iVDTYlgjcV0r8MIwfHpSmH',
        method: "GET"
      }).done(function(data) {
        console.log(startDate);
        console.log(endDate);
        if (data.results && data.results.length > 0) {
          // Add each day's closing price to an array
          var closingPrices = [];
          data.results.forEach(function(result) {
            closingPrices.push(result.c);
          });
          //setting all the json variables
          
          // Add the last 7 days' closing prices to the table row
          var closingPricesString = closingPrices.join(", ");
          var tableRow = '<tr><td>' + symbol + '</td><td>' + volume + '</td><td>' + volumeWeighted.toFixed(2) + '</td><td>' + openingPrice.toFixed(2) 
            + '</td><td>' + closingPrice.toFixed(2) + '</td><td>' + highestPrice.toFixed(2) + '</td><td>' + lowestPrice.toFixed(2) + '</td><td>' + unixTimestamp 
            + '</td><td>' + tradesToday + '</td><td>' + closingPricesString + '</td></tr>';
          // Append the table row to the stock-info-table
          $('#stock-info-table > tbody').append(tableRow);
          stockinfoJson = data;
          console.log(stockinfoJson);
          phpRequest(exchangeinfoJson, stockinfoJson);
        } else {
          console.log("No results found");
        }
      }).fail(function(error) {
        console.log("Error", error.statusText);
      });      
    } else {
      console.log("No results found");
    }
  }).fail(function(error) {
    console.log("Error", error.statusText);
  });
}
// gets the news about the current stock
function getStockNews(stock) {
  if (!stock) {
    console.log("Please select a stock");
    return;
  }

  $.ajax({
    url: 'https://api.polygon.io/v2/reference/news?ticker=' + stock + '&apiKey=hptM7CUVH3iVDTYlgjcV0r8MIwfHpSmH',
    method: "GET",
  }).done(function(data) {
    console.log(data);
    console.log(stock);
    // Clear previous news
    $('#stock-news').empty();

    // Add each news item to the container
    if (data.results.length > 0) {
      data.results.forEach(function(newsItem) {
        var newsHtml = '<div class="card">' +
          '<div class="card-header">' + newsItem.title + '</div>' +
          '<div class="card-body">' +
          '<p class="card-text">' + newsItem.description + '</p>' +
          '<a href="' + newsItem.article_url + '" class="btn btn-primary">Read more</a>' +
          '</div>' +
          '</div>';
        $('#stock-news').append(newsHtml);
      });
      phpRequest(exchangeinfoJson, stockinfoJson);
    } else {
      $('#stock-news').append('<p>No news available for this stock</p>');
    }
    newsJson = data;
  }).fail(function(error) {
    console.log("Error", error.statusText);
  });
}
// gets the php request and sends it to final.php
function phpRequest(exchangeinfoJson, stockinfoJson) {
  const exchangeInfo = JSON.stringify(exchangeinfoJson);
	const stockInfo= JSON.stringify(stockinfoJson);
  console.log(exchangeInfo);
  console.log(stockInfo);
  a=$.ajax({
    method: "POST", 
    url: "final.php",
    data: {method: "setStock", stockTicker: stock, queryType: callType, jsondata:stockInfo}
  }).done(function(data){
    console.log("good");
    }).fail(function(error){
    console.log("Bad");
  })
}

// History Section

const form = document.querySelector('form');
const dateInput = document.getElementById('date-input');
const maxLinesInput = document.getElementById('max-lines-input');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const selectedDate = dateInput.value;
  const maxLines = maxLinesInput.value;
  console.log(selectedDate, maxLines)
  getHistory(selectedDate, maxLines);
});

// showing a different way to do the tables than the first way I did
function getHistory(selectedDate, maxLines) {
  if (selectedDate != "" || maxLines < 1) {
    a=$.ajax({
      method:"POST",
      url: "final.php",
      data: {method: "getStock", date:selectedDate}
    }).done(function(data) {
      if (data.result.length == 0){
        console.log("empty");
        console.log(data);
        $("#history-table").html("");
        $("#history-table").append("<tr><td class='history-table'>No Data for " + selectedDate + "!</tr><td>");
      } else {
        console.log("stuff here");
        console.log(data);
        $("#history-table").html("");
        $("#history-table").append("<tr><th>Date/Time</th><th>Type</th><th>Stock</th><th></th></tr></div>");
        
        for (i = 0; i < maxLines; i++) {
          var json = data.result[i].jsonData;
          newjson = json;
          if (data.queryType === "news") {
            $("#history-table").append("<tr><td class='history-table'>" + data.result[i].dateTime + "</tr><td class='history-table'>" 
            + data.result[i].queryType + "</td>" + "<td class='history-table'>" + data.result[i].stockTicker +
            "</td><td class='history-table'><button type='button' class='btn btn-primary' onclick='news(newjson)'>History</button></div><p></p>");
          } else {
              $("#history-table").append("<tr><td class='history-table'>" + data.result[i].dateTime + "</tr><td class='history-table'>" 
            + data.result[i].queryType + "</td>" + "<td class='history-table'>" + data.result[i].stockTicker +
            "</td><td class='history-table'><button type='button' class='btn btn-primary' onclick='details(newjson)'>History</button></div>");
          }
        }
      }
    }).fail(function(error) {
      console.log("Something wrong with getHistory");
    });
  } else {
    alert("Select Date or Select more lines :)")
  }
}

function news(newjson) {
  $("#history").html("");
  console.log(newjson);
  len = newjson.results.length;

  for (i = 0; i < len; i++) {
    $("#history").append("<tr><td class='news'><span class='dot'></span>&emsp;&emsp;<a href='" + newjson.results[i].article_url + "' target=_blank'>" + newjson.results[i].title + "</a></td></tr>");
  }
}

function details(newjson) {
  console.log(newjson);
  
  stockTicker = newjson.ticker;
  newsJson = newjson.json;
  console.log(stockTicker);
  sumHigh = 0;
  sumLow = 0;
  volume = 0;


}