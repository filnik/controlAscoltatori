"use strict";

var ascoltatori = require('ascoltatori'),
    uuid = require('node-uuid'),
    // debugging
    debug = require('debug')('heartbeat');

/**
 *
 * @param opts ascoltatore, for the ascoltatore to wrap, the id of the ascoltatore and the heartbeat that
 * you want. Finally, the deathTime and the channel where you have to send the stats (statsChannel)
 * @return {*|ascoltatori.MemoryAscoltatore} return a memory ascoltatore instead of a wrap, if you get a
 * memoryascoltatore
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
    this.firstSubscribe = true;
    this.firstPublish = true;
    this.closed = false;
};

/**
 *
 * @param channel to attach with
 * @param callback to execute to every event
 */
HeartbeatAscoltatore.prototype.on = function (channel, callback) {
    this.ascoltatore.on(channel, callback);
};

/**
 * behave like a normal publish and start the heartbeats
 */
HeartbeatAscoltatore.prototype.publish = function () {
    this._debug('publish');
    if (this.firstPublish) {
        this._heartBeat();
        this.firstPublish = false;
    }
    this.ascoltatore.publish.apply(this.ascoltatore, arguments);
};

/**
 * subscribe as a normal ascoltatore and start the heartbeatChecker
 */
HeartbeatAscoltatore.prototype.subscribe = function () {
    this._debug('subscribe');
    if (this.firstSubscribe) {
        this.ascoltatore.subscribe(this.statsChannel + "/*", this._updateChecker());
        this._nodeChecker();
        this.firstSubscribe = false;
    }
    this.ascoltatore.subscribe.apply(this.ascoltatore, arguments);
};

/**
 * unsubscribe as a normal ascoltatore
 */
HeartbeatAscoltatore.prototype.unsubscribe = function () {
    this._debug('unsubscribe');
    this.ascoltatore.unsubscribe.apply(this.ascoltatore, arguments);
};

/**
 * registerDomain as a normal ascoltatore
 */
HeartbeatAscoltatore.prototype.registerDomain = function () {
    this._debug('registerDomain');
    this.ascoltatore.registerDomain.apply(this.ascoltatore, arguments);
};

// just copy ascoltatore interface
HeartbeatAscoltatore.prototype.sub = HeartbeatAscoltatore.prototype.subscribe;

HeartbeatAscoltatore.prototype.unsub = HeartbeatAscoltatore.prototype.unsubscribe;

HeartbeatAscoltatore.prototype.pub = HeartbeatAscoltatore.prototype.publish;

/**
 *
 * @param string to debug
 * @private
 */
HeartbeatAscoltatore.prototype._debug = function (string) {
    debug('id: ' + this.id + ' - ' + string);
};

/**
 * update the heartbeats in the table
 * @param channel of the heartbeat
 * @param message of the heartbeat
 * @private
 */
HeartbeatAscoltatore.prototype._updateChecker = function (channel) {
    var that = this;
    return function () {
        that.subscribedEntities[channel] = new Date();
    };
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
                if (new Date() - that.subscribedEntities[key] > that.heartbeat * that.deathTime){
                    var keySplit = key.split(this.statsChannel);
                    var id = keySplit[1];
                    delete that.subscribedEntities[key];
                    that.ascoltatore.emit('nodeDeath', {id : id});
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
    return {
        'id'    : this.id,
        'date'  : new Date()
    };
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
        that.sendStats();
    }, this.heartbeat);
    this.heartbeatTimers.push(heartbeatTimer);
};

/**
 *
 * @return {*} the id of the ascoltatore
 */
HeartbeatAscoltatore.prototype.getId = function () {
  return this.id;
};

/**
 * Clear the heartbeats before closing
 */
HeartbeatAscoltatore.prototype.close = function () {
    if (!this.closed){
        this.closed = true;
        this._debug('closing');
        for (var heartbeatTimer in this.heartbeatTimers){
            var timer = this.heartbeatTimers[heartbeatTimer];
            this._debug('closing timer ' + heartbeatTimer);
            clearInterval(timer);
        }
        var that = this;
        var outArguments = arguments;
        this.ascoltatore.unsubscribe(this.statsChannel + "/*", this._updateChecker(), function close () {
            that.ascoltatore.close.apply(that.ascoltatore, outArguments);
        });
    }else{
        this.ascoltatore.close.apply(this.ascoltatore, arguments);
    }
};

module.exports = HeartbeatAscoltatore;