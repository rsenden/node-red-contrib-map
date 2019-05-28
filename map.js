module.exports = function(RED) {
	var mustache = require("mustache");
	
    function MapConfigNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.keyName = n.keyName;
    	this.valueName = n.valueName;
    	this.mappings = n.mappings;
    }
    RED.nodes.registerType("map-config", MapConfigNode);
    
    function MapMapNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.config = RED.nodes.getNode(n.config);
    	this.in = n.in;
    	this.inType = n.inType;
    	this.inKeyOrValue = n.inKeyOrValue;
    	this.out = n.out;
    	this.outType = n.outType;
    	this.outKeyOrValue = n.outKeyOrValue;
    	this.caseInsensitive = n.caseInsensitive;
    	this.forwardIfNoMatch = n.forwardIfNoMatch;
    	this.defaultIfNoMatch = n.defaultIfNoMatch;
    	
    	var node = this;
    	
    	var mappings = !this.config.mappings ? [] : this.config.mappings.reduce(function(result, item) {
    		  var key = item[node.inKeyOrValue];
    		  var value = item[node.outKeyOrValue];
    		  if ( node.caseInsensitive ) {
    			  key = key.toLowerCase();
    		  }
    		  result[key] = value;
    		  return result;
    		}, {});
    	
    	node.on("input", function(msg) {

            try {
            	var inValue = RED.util.getMessageProperty(msg, node.in);
            	if ( node.caseInsensitive ) {
            		inValue = inValue.toLowerCase();
            	}
            	var outValue = mappings[inValue];
            	if ( !outValue && node.forwardIfNoMatch ) {
            		outValue = mustache.render(node.defaultIfNoMatch, msg);
            	}
            	if ( outValue ) {
            		RED.util.setMessageProperty(msg, node.out, outValue);
            		node.send(msg);
            	}
            }
            catch(err) {
                node.error(err.message, msg);
            }
        });
    	
    }
    RED.nodes.registerType("map-map", MapMapNode);
    
    function MapSetNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.config = RED.nodes.getNode(n.config);
    	this.from = n.from;
    	this.out = n.out;
    	this.outType = n.outType;
    	this.outKeyOrValue = n.outKeyOrValue;
    	
    	var node = this;
    	node.on("input", function(msg) {

            try {
		    	var mapping = !node.config.mappings ? null : this.config.mappings.find(function(mapping) {
		    		return mapping.key===node.from;
		    	});
		    	if (mapping) {
		    		RED.util.setMessageProperty(msg, node.out, mapping[node.outKeyOrValue]);
		            node.send(msg);
		    	}
            }
            catch(err) {
                node.error(err.message, msg);
            }
    	});
		    
    }
    RED.nodes.registerType("map-set", MapSetNode);
}
