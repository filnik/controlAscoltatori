"use strict";

var domain = require("domain");
var _ = require("underscore");

module.exports = function () {

    it("should return an unmasked ascoltatori if it's a memory one", function (done) {
        var ascoltatore = new ascoltatori.MemoryAscoltatore();
        var backAgain = new HeartbeatAscoltatore({ascoltatore : ascoltatore});
        if (ascoltatore === backAgain){
            done();
        } else {
            done(new Error("If a memory ascoltatore is given, don't mask it"));
        }
    });

    it("should immediately do nothing if the ascoltatore is the same", function (done) {
        var that = this;
        this.instance.on('nodeDeath', function () {
            done(new Error("this should never be called"));
        });
        this.instance.subscribe('hello', function () {});
        this.instance.publish('hello', "world", function () {
            that.instance.close();
        });
        setTimeout(function () {
            done(); // if nothing happends, let's pass the test
        }, 1000);
    });

    it("should do nothing if the ascoltatore is the same", function (done) {
        var that = this;
        this.instance.on('nodeDeath', function () {
            done(new Error("this should never be called"));
        });
        this.instance.subscribe('hello', function () {});
        this.instance.publish('hello', "world", function () {
            setTimeout(function delay() {
                that.instance.close(function () {
                    done();
                });
            }, 500);
        });
    });

    it("should not die before the close", function (done) {
        var that = this,
            youCanDie = false;
        this.instance.on('nodeDeath', function () {
            if (youCanDie) {
                done();
            } else {
                done(new Error("Died before the actual node's death"));
            }
        });
        this.instance2.on('nodeDEath', function () {
            done(new Error("The wrong node died"));
        });
        this.instance.subscribe('hello', function (channel, message) {
            if (message !== 'world') {
                done(new Error('wrong message received: ' + message));
            }
        });
        this.instance2.publish('hello', "world", function () {
            setTimeout(function delay() {
                youCanDie = true;
                that.instance2.close();
            }, 500);
        });
    });
};