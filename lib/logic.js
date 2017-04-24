var bitbank = require("node-bitbankcc");
var async = require("async");
var cache = require("./cache").cache;

// *****************
// 設定 / Settings
// *****************
var api = bitbank.privateApi("your_api_key", "ypur_api_secret");
var orderAmout = 0.01; // 注文数量 / order amount
var maxHoldBtc = 1.0; // ビットコインの最大保有量 / Max BTC holding amount
var spreadPercentage = 0.001; // スプレッド設定値 0.1% / Spread
// 例) 1BTC=135000円の場合、売り注文と買い注文を中央値から135円離した価格に提示する
var pair = "btc_jpy";

module.exports.trade = function() {
  console.log("--- prepare to trade ---");

  async.waterfall([
    function(callback) {
      // アセット取得
      api.getAsset().then(function(res){
        callback(null, res);
      });
    },
    function(assets, callback) {
      var btcAvailable = Number(assets.assets.filter(function(element, index, array) {
        return element.asset == "btc";
      })[0].free_amount);
      var jpyAvailable = Number(assets.assets.filter(function(element, index, array) {
        return element.asset == "jpy";
      })[0].free_amount);

      // アクティブオーダー取得
      api.getActiveOrders(pair, {}).then(function(res){
        callback(null, btcAvailable, jpyAvailable, res);
      });
    },
    function(btcAvailable, jpyAvailable, activeOrders, callback) {
      //console.log(activeOrders);
      var ids = activeOrders.orders.map(function(element, index, array) {
        return element.order_id;
      });
      // 全てキャンセル
      if(ids.length > 0) {
        console.log("--- cancel all active orders ---");
        api.cancelOrders(pair, ids).then(function(res) {
          //console.log(res);
          callback(null, btcAvailable, jpyAvailable);
        });
      } else {
        callback(null, btcAvailable, jpyAvailable);
      }
    },
    function(btcAvailable, jpyAvailable, callback) {
      // 新規注文
      var bestBid = parseInt(cache.get("best_bid"));
      var bestAsk = parseInt(cache.get("best_ask"));
      var spread = (bestBid + bestAsk) * 0.5 * spreadPercentage;
      var buyPrice = parseInt(bestBid - spread);
      var sellPrice = parseInt(bestAsk + spread);

      if(btcAvailable > maxHoldBtc) {
        callback("BTC amount is over the threthold.", null);
      }

      // 売り注文
      if(btcAvailable > orderAmout) {
        console.log("--- sell order --- ", sellPrice, orderAmout);
        api.order(pair, sellPrice, orderAmout, "sell", "limit").then(function(orderRes) {
          //console.log(orderRes);
        });
      }
      // 買い注文
      if(jpyAvailable > buyPrice * orderAmout) {
        console.log("--- buy order --- ", buyPrice, orderAmout);
        api.order(pair, buyPrice, orderAmout, "buy", "limit").then(function(orderRes) {
          //console.log(orderRes);
        });
      }
    }
  ],
  function(err, results) {
    if(err){
      console.log("[ERROR] " + err);
    }
  });

};
