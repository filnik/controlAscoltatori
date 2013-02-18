"use strict";

/**
 * HeartbeatAscoltatore constructor
 *
 * @param ascoltatore an ascoltatore to wrap (so you can use what you want)
 * @param id an id to identify the client using the ascoltatore given
 * @param heartbeat distance between a beat and another
 * @param deathTime heartbeat*deathTime measures how much time is needed for a node to be consider as dead
 * @constructor
 */
var HeartbeatAscoltatore = function(ascoltatore, id, heartbeat, deathTime){
    this.ascoltatore = ascoltatore;
    // for the close
    this.heartbeatTimers = [];
    this.id = id;
    // we have to remember the channels to notify when there is a node that died
    this.subscribedEntities = {};
    this.rememberCallbacks = {};
    this.heartbeat = 1000;
    this.deathTime = 3; // 3*heartbeat
    if (heartbeat !== undefined){
        this.heartbeat = heartbeat;
    }
    if (deathTime !== undefined){
        this.deathTime = deathTime;
    }
    this._nodeChecker();
};

/**
 * Simulate an eventEmitter
 *
 * @param channel to connect with
 * @param callback to attach to the channel
 */
HeartbeatAscoltatore.prototype.on = function(channel, callback) {
    this.ascoltatore.on(channel, callback);
};

/**
 * Check whether a node is still alive or not
 *
 * @private
 */
HeartbeatAscoltatore.prototype._nodeChecker = function(){
    var that = this;
    setInterval(function(){
        for (var key in that.subscribedEntities){
            if (new Date() - that.subscribedEntities[key] > that.heartbeat * that.deathTime){
                var keySplit = key.split("_heartbeat_");
                var channel = keySplit[0];
                var id = keySplit[1];
                that.ascoltatore.emit('nodeDeath', {channel: channel, id : id});
            }
        }
    }, this.heartbeat * this.deathTime);
};

/**
 *
 * @param callback is the real function that we need to encapsulate
 * @param channel of main function
 * @param message of the main function
 * @private
 */
HeartbeatAscoltatore.prototype._callbackEncapsulation = function(callback, channel, message){
    if (message !== undefined && message !== null && message.heartbeat !== undefined){
        this.subscribedEntities[channel + "_heartbeat_" + message.heartbeat] = new Date();
    }else{
        callback(channel, message);
    }
};

/**
 * The idea is that the eventEmitter remembers a given function. If we encapsulate it every time
 * it cannot understand which function we are talking about. So we memorize it in an intelligent
 * way, finding out the right one using an hash. Dark magic.
 *
 * @param callback to encapsulate
 * @return {function} return the encapsulated callback
 * @private
 */
HeartbeatAscoltatore.prototype._findEncapsulatededCallback = function(callback){
    if (this.rememberCallbacks[callback] !== undefined){
        return this.rememberCallbacks[callback];
    }
    var that = this;
    var encapCallback = function encapsCallback(channel, message){
        that._callbackEncapsulation(callback);
    };
    this.rememberCallbacks[callback] = encapCallback;
    return encapCallback;
};

/**
 * Subscribe to a new channel
 *
 * @param channel that the ascoltatore has to listen to
 * @param callback to incapsulate in order to avoid the heartbeats in the application logic
 * @param done what to execute after
 */
HeartbeatAscoltatore.prototype.subscribe = function(channel, callback, done){
    this.ascoltatore.subscribe(channel, this._findEncapsulatededCallback, done);
};
/**
 * Unsubscribe as ascoltatori normally works
 */
HeartbeatAscoltatore.prototype.unsubscribe = function(channel, callback, done){
    this.ascoltatore.unsubscribe(channel, this._findEncapsulatededCallback, done);
};

/**
 * Publish modified to add the heartbeats
 */
HeartbeatAscoltatore.prototype.publish = function(){
    var that = this;
    var channel = arguments[0];

    this.ascoltatore.on('newTopic', function handleNewConnection(){
        var heartbeatTimer = setInterval(function(){
            that.ascoltatore.publish(channel, {'heartbeat' : that.id});
        }, that.heartbeat);
        that.heartbeatTimers.push(heartbeatTimer);
    });
    this.ascoltatore.publish.apply(this.ascoltatore, arguments);
};

HeartbeatAscoltatore.prototype.sub = function(){
    this.subscribe.apply(this, arguments);
};

HeartbeatAscoltatore.prototype.unsub = function(){
    this.unsubscribe.apply(this, arguments);
};

HeartbeatAscoltatore.prototype.pub = function(){
    this.publish.apply(this, arguments);
};

/**
 * Clear the heartbeats before closing
 */
HeartbeatAscoltatore.prototype.close = function(){
    for (var heartbeatTimer in this.heartbeatTimers){
        clearInterval(heartbeatTimer);
    }
    this.ascoltatore.close(this.ascoltatore, arguments);
};

module.exports = HeartbeatAscoltatore;