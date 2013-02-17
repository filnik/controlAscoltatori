global.sinon = require("sinon");
global.chai = require("chai");
global.expect = require("chai").expect;
global.async = require("async");
global.ascoltatori = require("ascoltatori");

global.redisSettings = function() {
  return {
    redis: require('redis')
  };
};

var portCounter = 50042;
global.nextPort = function() {
  return ++portCounter;
};

global.behaveLikeAnAscoltatore = require("./behave_like_an_ascoltatore");
global.wrap = require("ascoltatori").util.wrap;

//var sinonChai = require("sinon-chai");
//chai.use(sinonChai);