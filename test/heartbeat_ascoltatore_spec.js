
describe(HeartbeatAscoltatore, function() {

  behaveLikeAnAscoltatore();

  beforeEach(function(done) {
    this.instance = new HeartbeatAscoltatore(new ascoltatori.MemoryAscoltatore(), 'id');
    this.instance.on("ready", done);
  });

  afterEach(function() {
    this.instance.close();
  });


});
