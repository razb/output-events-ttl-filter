const NodeCache = require( "node-cache" );
const ShortHash = require("shorthash")
const ttlCache = new NodeCache( { stdTTL: 120, checkperiod: 60 } );
function ttlExpired (shortie, ttl, debug, msg) {
  let remaining = ttlCache.getTtl(shortie)
  if ( remaining && remaining > 0 ) {
      if (debug) {
      console.log('dropped', msg, parseInt((remaining - Date.now())/1000))
      }
      return false
      } else {
      if (debug) {
      console.log('passed', msg, ttl)
      }
      ttlCache.set(shortie, true, ttl)
      return true
      }
}

function eventsTtlFilter (context, config, eventEmitter, data, callback) {
  let ttl = config.ttl || 60;
  let debug = config.debug || false;
  if (data === undefined) {
    return callback(new Error('data is null'), null)
  }
  try {
      if ( data && data.message ) {
      let msg = data.message;
      let shortie = ShortHash.unique(msg);
      if (ttlExpired(shortie, ttl, debug, msg)) {
      data.hash = shortie
      return callback(null, data)
      } else {
      return callback(null, null)
      }
      } else {
      return callback(null, data)
      }
  } catch (ex) {
    console.log(data, 'exception', ex)
    return callback(null, data)
  }
}
module.exports = eventsTtlFilter
