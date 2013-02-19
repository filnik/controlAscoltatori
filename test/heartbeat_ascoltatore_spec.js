"use strict";

var ascoltatoreHeartbeats = require('./ascoltatore_heartbeats');

describe(HeartbeatAscoltatore, function() {

  behaveLikeAnAscoltatore();
  ascoltatoreHeartbeats();

  beforeEach(function(done) {
    var that = this;
    this.instance = new HeartbeatAscoltatore({
        ascoltatore     : new ascoltatori.MemoryAscoltatore(),
        heartbeat       : 100,
        deathTime       : 2
    });

    this.instance2 = new HeartbeatAscoltatore({
      ascoltatore     : new ascoltatori.MemoryAscoltatore(),
      heartbeat       : 100,
      deathTime       : 2
    });


    this.instance.on("ready", function () {
        that.instance2.on('ready', function () {
            done();
        });
    });

  });

  afterEach(function() {
    this.instance.close();
  });

});
