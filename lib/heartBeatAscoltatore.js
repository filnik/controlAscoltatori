"use strict";

var ascoltatori = require('ascoltatori'),
    uuid = require('node-uuid'),
    // debugging
    debug = require('debug')('heartbeat');

/**
 * HeartbeatAscoltatore constructor
 *
 * @param ascoltatore an ascoltatore to wrap (so you can use what you want)
 * @param id an id to identify the client using the ascoltatore given
 * @param heartbeat distance between a beat and another
 * @param deathTime heartbeat*deathTime measures how much time is needed for a node to be consider as dead
 * @constructor
 */
var HeartbeatAscoltatore = function (opts) {
    this.ascoltatore = opts.ascoltatore;
    if (this.ascoltatore === undefined || this.ascoltatore._ascoltatore === undefined) {
        console.warn("WARNING: don't use heartbeatAscoltatore with a MemoryAscoltatore. It's an useless overhead");
        console.warn("-> disabling heartbeart");
        return this.ascoltatore || new ascoltatori.MemoryAscoltatore();
    }
    this.heartbeat = opts.heartbeat || 1000;
    this.deathTime = opts.deathTime || 3; // 3*heartbeat
    this.statsChannel = opts.statsChannel || 'stats';
    this.id = opts.id || uuid.v1();
    // for the close
    this.heartbeatTimers = [];
    // we have to remember the channels to notify when there is a node that died
    this.subscribedEntities = {};
    this.rememberCallbacks = {};
    this._nodeChecker();
    this._heartBeat();
};

// just copy the Ascoltatori interface
HeartbeatAscoltatore.prototype.on = function () {
    this.ascoltatore.on.apply(this.ascoltatore, arguments);
};

HeartbeatAscoltatore.prototype.publish = function () {
    this.ascoltatore.publish.apply(this.ascoltatore, arguments);
};

HeartbeatAscoltatore.prototype.subscribe = function () {
    this.ascoltatore.subscribe.apply(this.ascoltatore, arguments);
};

HeartbeatAscoltatore.prototype.unsubscribe = function () {
    this.ascoltatore.unsubscribe.apply(this.ascoltatore, arguments);
};

HeartbeatAscoltatore.prototype.registerDomain = function () {
    this.ascoltatore.registerDomain.apply(this.ascoltatore, arguments);
};

/**
 *
 * @param string to debug
 * @private
 */
HeartbeatAscoltatore.prototype._debug = function (string) {
    debug('id: ' + this.id + ' - ' + string);
};

/**
 * Check whether a node is still alive or not
 *
 * @private
 */
HeartbeatAscoltatore.prototype._nodeChecker = function () {
    this._debug('nodeChecker started');
    var that = this,
        timer = setInterval(function () {
            for (var key in that.subscribedEntities){
                that._debug('checking ' + that.subscribedEntities[key]);
                if (new Date() - that.subscribedEntities[key] > that.heartbeat * that.deathTime){
                    var keySplit = key.split("_heartbeat_");
                    var channel = keySplit[0];
                    var id = keySplit[1];
                    delete that.subscribedEntities[key];
                    that.ascoltatore.emit('nodeDeath', {channel: channel, id : id});
                    that._debug(that.subscribedEntities[key] + ' is dead. Emitting the signal');
                }
            }
        }, this.heartbeat * this.deathTime);
    this.heartbeatTimers.push(timer);
};

/**
 * useful to overwrite if we derive from this ascoltatore
 * @return {Object} the info about this node
 * @private
 */
HeartbeatAscoltatore.prototype._dataToSend = function () {
    return {'heartbeat' : this.id};
};

/**
 * send the stats about the node. In this case, only the heartbeat
 */
HeartbeatAscoltatore.prototype.sendStats = function () {
    this.ascoltatore.publish(this.statsChannel + "/" + this.id, this._dataToSend());
};

/**
 *
 * @param channel in which we need to do the heartbeat
 * @private
 */
HeartbeatAscoltatore.prototype._heartBeat = function () {
    this._debug('starting the heartBeats');
    var that = this;
    // do it AT LEAST ONCE. Do not delete the following line.
    this.sendStats();
    var heartbeatTimer = setInterval(function(){
        that._debug('heartbeat at ' + new Date());
        that.sendStats();
    }, this.heartbeat);
    this.heartbeatTimers.push(heartbeatTimer);
};

/**
 *
 * @param callback is the real function that we need to encapsulate
 * @param channel of main function
 * @param message of the main function
 * @private
 */
HeartbeatAscoltatore.prototype._callbackEncapsulation = function (callback, channel, message) {
    this.subscribedEntities[channel + "_heartbeat_" + message.heartbeat] = new Date();
    callback(channel, message);
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
HeartbeatAscoltatore.prototype._findEncapsulatededCallback = function (callback) {
    if (this.rememberCallbacks[callback] !== undefined) {
        return this.rememberCallbacks[callback];
    }
    var that = this;
    var encapCallback = function encapsCallback(channel, message){
        that._callbackEncapsulation(callback, channel, message);
    };
    this.rememberCallbacks[callback] = encapCallback;
    return encapCallback;
};

/**
 *
 * @return {*} the id of the ascoltatore
 */
HeartbeatAscoltatore.prototype.getId = function () {
  return this.id;
};

/**
 * Subscribe to a new channel
 *
 * @param channel that the ascoltatore has to listen to
 * @param callback to incapsulate in order to avoid the heartbeats in the application logic
 * @param done what to execute after
 */
HeartbeatAscoltatore.prototype.subscribe = function(channel, callback, done){
    var encaspulatedCallback = this._findEncapsulatededCallback(callback);
    this.ascoltatore.subscribe(channel, encaspulatedCallback, done);
};

/**
 * Unsubscribe as ascoltatori normally works *
 * @param channel that the ascoltatore has to unsubscribe
 * @param callback to delete from the channel
 * @param done what to execute after
 */
HeartbeatAscoltatore.prototype.unsubscribeHeartbeat = function (channel, callback, done) {
    this._debug('unsubscription to ' + channel);
    var encaspulatedCallback = this._findEncapsulatededCallback(callback);
    this.ascoltatore.unsubscribe(channel, encaspulatedCallback, done);
};

/**
 * Clear the heartbeats before closing
 */
HeartbeatAscoltatore.prototype.close = function () {
    this._debug('closing');
    for (var heartbeatTimer in this.heartbeatTimers){
        var timer = this.heartbeatTimers[heartbeatTimer];
        this._debug('closing timer ' + heartbeatTimer);
        clearInterval(timer);
    }
    this.ascoltatore.close.apply(this.ascoltatore, arguments);
};

HeartbeatAscoltatore.prototype.sub = HeartbeatAscoltatore.prototype.subscribe;

HeartbeatAscoltatore.prototype.unsub = HeartbeatAscoltatore.prototype.unsubscribe;

HeartbeatAscoltatore.prototype.pub = HeartbeatAscoltatore.prototype.publish;

module.exports = HeartbeatAscoltatore;