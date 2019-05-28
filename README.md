# node-red-contrib-map

This is a [Node-RED] plugin that provides the following nodes:

* *map-config*: Configuration node that allows for configuring mappings and related
  properties for use by the other nodes. For example, this allows for defining mappings
  between device id's and friendly names, and vice versa.
* *map-map*: Allows for mapping a configurable property from an input message to a
  configurable property on the output message, based on the configured mappings. For 
  example, given an input message containing `topic:deviceId`, this node can add
  add a message property `topicName:deviceName`.
* *map-set*: Allows for adding a configurable property based on a specific mapping
  in the configured mappings. For example, this allows for adding a property 
  `topic:deviceId` for a given device to any input message.
* *map-switch*: Allows for switching between one or more outputs based on configured
  mappings. For example, given an input message containing `topic:deviceId`, 
  you can define separate outputs for device id `deviceId1` and `deviceId2`.
  
[Node-RED]:  http://nodered.org/  

