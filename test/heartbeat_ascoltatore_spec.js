
var ascoltatoreHeartbeats = require('./ascoltatore_heartbeats');

describe(HeartbeatAscoltatore, function() {

  behaveLikeAnAscoltatore();
  ascoltatoreHeartbeats();

  beforeEach(function(done) {
    this.instance = new HeartbeatAscoltatore(new ascoltatori.MemoryAscoltatore(), 'id', 100, 2);
    this.instance.on("ready", done);
  });

  afterEach(function() {
    this.instance.close();
  });

});
