"use strict";

var ascoltatoreHeartbeats = require('./ascoltatore_heartbeats');

describe(HeartbeatAscoltatore, function () {

  behaveLikeAnAscoltatore();
  ascoltatoreHeartbeats();

  beforeEach(function(done) {
    var that = this;
    this.instance = new HeartbeatAscoltatore({
      ascoltatore     : new ascoltatori.RedisAscoltatore(redisSettings),
      id              : 'instance',
      heartbeat       : 100,
      deathTime       : 2,
      controlChannel  : controlChannel
    });

    this.instance2 = new HeartbeatAscoltatore({
      ascoltatore         : new ascoltatori.RedisAscoltatore(redisSettings),
      id                  : 'instance2',
      heartbeat           : 100,
      deathTime           : 2,
      controlChannel      : controlChannel
    });

    this.instance.on("ready", function () {
      that.instance2.on('ready', function () {
        done();
      });
    });
  });

  afterEach(function () {
    this.instance.close();
  });

});