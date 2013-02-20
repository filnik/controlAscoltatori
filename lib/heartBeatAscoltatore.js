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
    this.id = opts.id || uuid.v1();
    // for the close
    this.heartbeatTimers = [];
    // check whether we are already sending the heartbeats
    this.heartbeatChannelPublish = [];
    // we have to remember the channels to notify when there is a node that died
    this.subscribedEntities = {};
    this.rememberCallbacks = {};
    this._nodeChecker();
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
 *
 * @param channel is the channel that we have to check whether we are already sanding the heartbeats
 * @return {Boolean} true if it is the first publish in this channel
 * @private
 */
HeartbeatAscoltatore.prototype._firstPublishIn = function (channel) {
    if (this.heartbeatChannelPublish.indexOf(channel) === -1){
        this.heartbeatChannelPublish.push(channel);
        return true;
    }
    return false;
};

/**
 *
 * @param channel in which we need to do the heartbeat
 * @private
 */
HeartbeatAscoltatore.prototype._heartBeat = function (channel) {
    if (this._firstPublishIn(channel)){
        this._debug('starting the heartBeats');
        var that = this;
        // do it AT LEAST ONCE. Do not delete the following line.
        that.ascoltatore.publish(channel, {'heartbeat' : that.id});
        var heartbeatTimer = setInterval(function(){
            that._debug('heartbeat at ' + new Date());
            that.ascoltatore.publish(channel, {'heartbeat' : that.id});
        }, this.heartbeat);
        this.heartbeatTimers.push(heartbeatTimer);
    }
};

/**
 *
 * @param callback is the real function that we need to encapsulate
 * @param channel of main function
 * @param message of the main function
 * @private
 */
HeartbeatAscoltatore.prototype._callbackEncapsulation = function (callback, channel, message) {
    if (message !== undefined && message !== null && message.heartbeat !== undefined){
        this._debug('heartbeat received by ' + message.heartbeat + ' at ' + new Date());
        this.subscribedEntities[channel + "_heartbeat_" + message.heartbeat] = new Date();
    } else {
        this._debug('message received: ' + message + ' at channel ' + channel);
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
 * Simulate an eventEmitter
 *
 * @param channel to connect with
 * @param callback to attach to the channel
 */
HeartbeatAscoltatore.prototype.on = function (channel, callback) {
    this.ascoltatore.on(channel, callback);
};

/**
 * Subscribe to a new channel
 *
 * @param channel that the ascoltatore has to listen to
 * @param callback to incapsulate in order to avoid the heartbeats in the application logic
 * @param done what to execute after
 */
HeartbeatAscoltatore.prototype.subscribe = function (channel, callback, done) {
    this._debug('subscription to ' + channel);
    var encaspulatedCallback = this._findEncapsulatededCallback(callback);
    this.ascoltatore.subscribe(channel, encaspulatedCallback, done);
};

/**
 * Unsubscribe as ascoltatori normally works
 */
HeartbeatAscoltatore.prototype.unsubscribe = function (channel, callback, done) {
    this._debug('unsubscription to ' + channel);
    var encaspulatedCallback = this._findEncapsulatededCallback(callback);
    this.ascoltatore.unsubscribe(channel, encaspulatedCallback, done);
};

/**
 * Publish modified to add the heartbeats
 */
HeartbeatAscoltatore.prototype.publish = function () {
    var that = this;
    var channel = arguments[0];
    this._debug('publish to ' + channel);
    this._heartBeat(channel);
    this.ascoltatore.publish.apply(this.ascoltatore, arguments);
};

HeartbeatAscoltatore.prototype.sub = function () {
    this.subscribe.apply(this, arguments);
};

HeartbeatAscoltatore.prototype.unsub = function () {
    this.unsubscribe.apply(this, arguments);
};

HeartbeatAscoltatore.prototype.pub = function () {
    this.publish.apply(this, arguments);
};

HeartbeatAscoltatore.prototype.registerDomain = function () {
    this.ascoltatore.registerDomain.apply(this.ascoltatore, arguments);
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

module.exports = HeartbeatAscoltatore;