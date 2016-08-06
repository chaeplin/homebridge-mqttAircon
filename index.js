// MQTT Switch Accessory plugin for HomeBridge

'use strict';

var Service, Characteristic;
var mqtt = require("mqtt");

function mqttAirconAccessory(log, config) {
  this.log          = log;
  this.name         = config["name"];
  this.url          = config["url"];

  this.on           = false;
  this.TargetTemperature          = 27;
  this.TargetHeatingCoolingState  = 0;
  this.CurrentTemperature         = 26;
  this.TemperatureDisplayUnits    = 0;
  this.CurrentRelativeHumidity    = 50;
  this.CurrentHeatingCoolingState = 0;

  this.service = new Service.Thermostat(this.name);
  this.service
    .addCharacteristic(Characteristic.On);

  this.service.getCharacteristic(Characteristic.On)
    .on('set', this.setTargetHeatingCoolingState.bind(this));

  this.service.getCharacteristic(Characteristic.TargetTemperature)
    .setProps({
        maxValue: 30,
        rinValue: 18,
        minStep: 1
    })
    .on('set', this.setTargetTemperature.bind(this))
    .on('get', this.getTargetTemperature.bind(this));

  this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
    .on('set', this.setTargetHeatingCoolingState.bind(this))
    .on('get', this.getTargetHeatingCoolingState.bind(this));

  this.service.getCharacteristic(Characteristic.CurrentTemperature)
    .setProps({
        maxValue: 100,
        minValue: 0,
        minStep: 0.01
    })
    .on('get', this.getCurrentTemperature.bind(this));

  this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
    .on('get', this.getTemperatureDisplayUnits.bind(this));

  this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    .setProps({
        maxValue: 100,
        minValue: 0,
        minStep: 0.01
    })
    .on('get', this.getCurrentRelativeHumidity.bind(this));

  this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)    
    .on('get', this.getCurrentHeatingCoolingState.bind(this));

  this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature)
    .setProps({
        maxValue: 30,
        minValue: 18,
        minStep: 1
    });
}

module.exports = function(homebridge) {
      Service = homebridge.hap.Service;
      Characteristic = homebridge.hap.Characteristic;
      homebridge.registerAccessory("homebridge-mqttAircon", "mqttAircon", mqttAirconAccessory);
}

mqttAirconAccessory.prototype.getTargetHeatingCoolingState = function(callback) {
    callback(null, this.TargetHeatingCoolingState);
}

mqttAirconAccessory.prototype.setTargetHeatingCoolingState = function(TargetHeatingCoolingState, callback, context) {
    if(context !== 'fromSetValue') {
      this.TargetHeatingCoolingState = TargetHeatingCoolingState;
      //this.client.publish(this.topics.setTargetHeatingCoolingState, this.TargetHeatingCoolingState.toString());
    }
    callback();
}

mqttAirconAccessory.prototype.getTargetTemperature = function(callback) {
    callback(null, this.TargetTemperature);
}

mqttAirconAccessory.prototype.setTargetTemperature = function(TargetTemperature, callback, context) {
    if(context !== 'fromSetValue') {
      this.TargetTemperature = TargetTemperature;
      //this.client.publish(this.topics.setTargetTemperature, this.TargetTemperature.toString());
    }
    callback();
}

mqttAirconAccessory.prototype.getCurrentTemperature = function(callback) {
    callback(null, this.CurrentTemperature);
}

mqttAirconAccessory.prototype.getTemperatureDisplayUnits = function(callback) {
    callback(null, this.TemperatureDisplayUnits);
}

mqttAirconAccessory.prototype.getCurrentRelativeHumidity = function(callback) {
    callback(null, this.CurrentRelativeHumidity);
}

mqttAirconAccessory.prototype.getCurrentHeatingCoolingState = function(callback) {
    callback(null, this.CurrentHeatingCoolingState);
}

mqttAirconAccessory.prototype.getServices = function() {
  return [this.service];
}
