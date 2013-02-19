
var domain = require("domain");
var _ = require("underscore");

module.exports = function () {

    it("should keep the heartbeats", function (done) {
      var that = this;
      this.instance.on('nodeDeath', function () {
          done();
      });
      this.instance.subscribe('hello', function () {});
      this.instance.publish('hello', "world", function () {
          that.instance.close();
      });
    });

    it("should not die before the close", function (done) {
        var that = this;
        var youCanDie = false;
        this.instance.on('nodeDeath', function () {
            if (youCanDie){
                done();
            }
        });
        this.instance.subscribe('hello', function () {});
        this.instance.publish('hello', "world", function () {
            setTimeout(function delay() {
                youCanDie = true;
                that.instance.close();}, 500);
        });
    });
};
