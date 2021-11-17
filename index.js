const NodeCache = require("node-cache");
const ShortHash = require("shorthash")
const ttlCache = new NodeCache({
    stdTTL: 120,
    checkperiod: 60
});

function ttlExpired(shortie, ttl, debug, msg, data) {
    let remaining = ttlCache.getTtl(shortie)
    if (remaining && remaining > 0) {
        if (debug) {
            console.log('TTL in effect', msg, parseInt((remaining - Date.now()) / 1000))
        }
        return false
    } else {
        if (debug) {
            console.log('passed', data, ttl)
        }
        ttlCache.set(shortie, true, ttl)
        return true
    }
}

function eventsTtlFilter(context, config, eventEmitter, data, callback) {
    let ttl = config.ttl || 60;
    let drop = config.dropEvents || false;
    let debug = config.debug || false;
    if (data === undefined) {
        return callback(new Error('data is null'), null)
    }
    let keys = config.keys || ['message']
    try {
        if (data && data.message) {
            let msg = ''
            keys.map(key => {
                key = 'data.' + key.replace(/\./g,'?.')
                if (eval(key)) {
                    msg = msg + (msg == '' ? '' : ':') + eval(key);
                }
            })
            let shortie = ShortHash.unique(msg)
            let shortmessage = ShortHash.unique(data.message)
            if (ttlExpired(shortie, ttl, debug, msg, data)) {
                data.hash = shortie
                data.shortmsg = shortmessage;
                return callback(null, data)
            } else {
                if (drop) {
                    if (debug) {
                        console.log('Dropping event due to TTL', msg)
                    }
                    return callback(null, null)
                } else {
                    data.hash = shortie
                    data.shortmsg = shortmessage;
                    data.ttlactive = true;
                    return callback(null, data)
                }
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
