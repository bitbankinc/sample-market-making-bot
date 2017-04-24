var LRU = require("lru-cache");
var options = {
  max: 100,
  maxAge: 60 * 1000 // 1min
};
exports.cache = LRU(options);
