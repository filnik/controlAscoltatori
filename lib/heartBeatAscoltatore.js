"use strict";

var EventEmitter = require('events').EventEmitter;

/**
 * HeartbeatAscoltatore constructor
 *
 * @param {ascoltatore} an ascoltatore to wrap (so you can use what you want)
 * @param {id} an id to identify the client using the ascoltatore given
 * @param {heartbeat} distance between a beat and another
 * @param {deathTime} heartbeat*deathTime measures how much time is needed for a node to be consider as dead
 */
var HeartbeatAscoltatore = function(ascoltatore, id, heartbeat, deathTime){
    EventEmitter.call(this);
    this.ascoltatore = ascoltatore;
    // we have to remember if this is the first publish or not (to create the setInterval)
    this.connectedChannels = [];
    // for the close
    this.heartbeatTimers = [];
    this.id = id;
    // we have to remember the channels to notify when there is a node that died
    this.subscribedEntities = {};
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

// inherit from EventEmitter
HeartbeatAscoltatore.prototype = Object.create(EventEmitter.prototype);

/**
 * Check whether a node is still alive or not
 *
 * @api private
 */
HeartbeatAscoltatore.prototype._nodeChecker = function(){
    var that = this;
    setInterval(function(){
        for (var key in that.subscribedEntities){
            if (new Date() - that.subscribedEntities[key] > that.heartbeat * that.deathTime){
                var keySplit = key.split("_heartbeat_");
                var channel = keySplit[0];
                var id = keySplit[1];
                that.emit('nodeDeath', {channel: channel, id : id});
            }
        }
    }, this.heartbeat * this.deathTime);
}

/**
 * Subscribe to a new channel
 *
 * @param {channel} that the ascoltatore has to listen to
 * @param {callback} callback to incapsulate in order to avoid the heartbeats in the application logic
 */
HeartbeatAscoltatore.prototype.subscribe = function(channel, callback){
    var that = this;

    this.ascoltatore.subscribe(channel, function myHeartBeatCallback(channel, message){
        if (message.heartbeat !== undefined){
            that.subscribedEntities[channel + "_heartbeat_" + message.heartbeat] = new Date();
        }else{
            callback(channel, message);
        }
    });
};

/**
 * Unsubscribe as ascoltatori normally works
 */
HeartbeatAscoltatore.prototype.unsubscribe = function(){
    this.ascoltatore.unsubscribe.apply(this.ascoltatore, arguments);
};

/**
 * Publish modified to add the heartbeats
 */
HeartbeatAscoltatore.prototype.publish = function(){
    var that = this;

    this.ascoltatore.publish.apply(this.ascoltatore, arguments);
    var channel = arguments[0];

    if (this.connectedChannels.indexOf(channel) === -1){
        this.connectedChannels.push(channel);

        var heartbeatTimer = setInterval(function(){
            that.ascoltatore.publish(channel, {'heartbeat' : that.id});
        }, this.heartbeat);
        this.heartbeatTimers.push(heartbeatTimer);
    }
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