global.sinon = require("sinon");
global.chai = require("chai");
global.expect = require("chai").expect;
global.async = require("async");
global.ascoltatori = require("ascoltatori");
global.HeartbeatAscoltatore = require('../lib/heartbeatAscoltatore.js');

global.nextPort = function() {
  return ++portCounter;
};

global.behaveLikeAnAscoltatore = require("./behave_like_an_ascoltatore");
global.wrap = require("ascoltatori").util.wrap;

var sinonChai = require("sinon-chai");
chai.use(sinonChai);