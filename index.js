// MQTT Switch Accessory plugin for HomeBridge

'use strict';

var Service, Characteristic;
var mqtt = require("mqtt");

function mqttAirconAccessory(log, config) {
  this.log          = log;
  this.name         = config["name"];
  this.url          = config["url"];
  this.client_Id    = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
  this.options      = {
      keepalive: 10,
      clientId: this.client_Id,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
           topic: 'WillMsg',
           payload: 'Connection Closed abnormally..!',
           qos: 0,
           retain: false
      },
      username: config["username"],
      password: config["password"],
      rejectUnauthorized: false
  };
  this.caption                    = config["caption"];
  this.topics                     = config["topics"];
  this.payload_mode               = config["payload_mode"];
  this.payload_on                 = config["payload_on"];
  this.payload_off                = config["payload_off"];
  this.payload_temp               = config["payload_temp"];
  this.payload_ctemp              = config["payload_ctemp"];
  this.payload_chui               = config["payload_chui"];

  this.TargetTemperature          = config["TargetTemperature"];
  this.TargetHeatingCoolingState  = config["TargetHeatingCoolingState"];
  this.CurrentHeatingCoolingState = config["TargetHeatingCoolingState"];
  this.CurrentTemperature         = 26;
  this.CurrentRelativeHumidity    = 0;
  this.TemperatureDisplayUnits    = 0;
  this.options_publish = {
    qos: 0,
    retain: true
  };

  this.service = new Service.Thermostat(this.name);

  this.service.getCharacteristic(Characteristic.TargetTemperature)
    .setProps({
        maxValue: 30,
        minValue: 18,
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


  // connect to MQTT broker
  this.client = mqtt.connect(this.url, this.options);
  var that = this;
  this.client.on('error', function (err) {
      that.log('Error event on MQTT:', err);
  });

  this.client.on('message', function (topic, message) {
    if (topic == that.topics.getOn) {
        var status = JSON.parse(message);
        that.CurrentHeatingCoolingState = (status[that.payload_mode] == that.payload_on ? Characteristic.CurrentHeatingCoolingState.COOL : Characteristic.CurrentHeatingCoolingState.OFF);
        that.TargetTemperature          = status[that.payload_temp];
        that.CurrentTemperature         = status[that.payload_ctemp];
        that.CurrentRelativeHumidity    = status[that.payload_chui];

        that.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).setValue(that.CurrentHeatingCoolingState, undefined, 'fromSetValue');
        that.service.getCharacteristic(Characteristic.TargetTemperature).setValue(that.TargetTemperature, undefined, 'fromSetValue');
        that.service.getCharacteristic(Characteristic.CurrentTemperature).setValue(that.CurrentTemperature, undefined, 'fromSetValue');
        that.service.getCharacteristic(Characteristic.CurrentRelativeHumidity).setValue(that.CurrentRelativeHumidity, undefined, 'fromSetValue');
    }
  });
  this.client.subscribe(this.topics.getOn);
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
      if (this.TargetHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.COOL) {
        this.client.publish(this.topics.setOn,  '{"' + this.payload_mode + '":' + this.payload_on + ',"' + this.payload_temp + '":' + this.TargetTemperature + '}', this.options_publish);
      } else if (this.TargetHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.OFF) {
        this.client.publish(this.topics.setOn,  '{"' + this.payload_mode + '":' + this.payload_off + ',"' + this.payload_temp + '":' + this.TargetTemperature + '}', this.options_publish);
      }
    }
    callback();
}

mqttAirconAccessory.prototype.getTargetTemperature = function(callback) {
    callback(null, this.TargetTemperature);
}

mqttAirconAccessory.prototype.setTargetTemperature = function(TargetTemperature, callback, context) {
    if(context !== 'fromSetValue') {
      this.TargetTemperature = TargetTemperature;
      if (this.TargetHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.COOL) {
        this.client.publish(this.topics.setOn,  '{"' + this.payload_mode + '":' + this.payload_on + ',"' + this.payload_temp + '":' + this.TargetTemperature + '}', this.options_publish);
      } else if (this.TargetHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.OFF) {
        this.client.publish(this.topics.setOn,  '{"' + this.payload_mode + '":' + this.payload_off + ',"' + this.payload_temp + '":' + this.TargetTemperature + '}', this.options_publish);
      }
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
