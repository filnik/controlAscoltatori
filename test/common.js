"use strict";

global.sinon = require("sinon");
global.chai = require("chai");
global.expect = require("chai").expect;
global.async = require("async");
global.ascoltatori = require("../../ascoltatori");
global.HeartbeatAscoltatore = require('../lib/heartbeatAscoltatore.js');

global.nextPort = function () {
  return ++portCounter;
};

global.controlChannel = 'control';

global.redisSettings = function () {
  return {
    redis: require('redis')
  };
};

global.behaveLikeAnAscoltatore = ascoltatori.behaveLikeAnAscoltatore;
global.wrap = require("ascoltatori").util.wrap;

var sinonChai = require("sinon-chai");
chai.use(sinonChai);