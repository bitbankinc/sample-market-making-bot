var logic = require("./lib/logic");
var cache = require("./lib/cache").cache;

var SUBSCRIBE_KEY = "sub-c-e12e9174-dd60-11e6-806b-02ee2ddab7fe";
var TICKER_CHANNEL = "ticker_btc_jpy";

var PubNub = require("pubnub");
var pubnub = new PubNub({
  subscribeKey: SUBSCRIBE_KEY
});

pubnub.addListener({
  message: function(message) {
    cache.set("best_bid", message.message.data.buy);
    cache.set("best_ask", message.message.data.sell);
  }
});

pubnub.subscribe({
  channels: [TICKER_CHANNEL]
});

console.log("--- order process starts 10 sec later ---");

setInterval(function() {
  logic.trade();
}, 1000 * 10);
