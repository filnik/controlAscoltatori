
describe(ascoltatori.HeartbeatAscoltatore, function() {

  behaveLikeAnAscoltatore();

  beforeEach(function(done) {
    this.instance = new ascoltatori.HeartbeatAscoltatore(redisSettings());
    this.instance.on("ready", done);
  });

  afterEach(function() {
    this.instance.close();
  });


});
