
var domain = require("domain");
var _ = require("underscore");

module.exports = function () {

  it("should keep the heartbeats", function (done) {
      var that = this;
      this.instance.on('nodeDeath', done);
      this.instance.subscribe('hello', function () {});
      this.instance.publish("hello", "world", function () {
          that.instance.close();
      });
  });
};
