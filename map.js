module.exports = function(RED) {
	var mustache = require("mustache");
	
    function MapConfigNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.rhsName = n.rhsName;
    	this.lhsName = n.lhsName;
    	this.mappings = n.mappings;
    }
    RED.nodes.registerType("map-config", MapConfigNode);
    
    function MapMapNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.config = RED.nodes.getNode(n.config);
    	this.in = n.in;
    	this.inType = n.inType;
    	this.inLhsOrRhs = n.inLhsOrRhs;
    	this.out = n.out;
    	this.outType = n.outType;
    	this.outLhsOrRhs = n.outLhsOrRhs;
    	this.caseInsensitive = n.caseInsensitive;
    	this.forwardIfNoMatch = n.forwardIfNoMatch;
    	this.defaultIfNoMatch = n.defaultIfNoMatch;
    	
    	var node = this;
    	
    	var mappings = !this.config.mappings ? [] : this.config.mappings.reduce(function(result, item) {
    		  var key = item[node.inLhsOrRhs];
    		  var value = item[node.outLhsOrRhs];
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
    	this.outLhsOrRhs = n.outLhsOrRhs;
    	
    	var node = this;
    	node.on("input", function(msg) {

            try {
		    	var mapping = !node.config.mappings ? null : this.config.mappings.find(function(mapping) {
		    		return mapping.lhs===node.from;
		    	});
		    	if (mapping) {
		    		RED.util.setMessageProperty(msg, node.out, mapping[node.outLhsOrRhs]);
		            node.send(msg);
		    	}
            }
            catch(err) {
                node.error(err.message, msg);
            }
    	});
		    
    }
    RED.nodes.registerType("map-set", MapSetNode);
    
    function MapSwitchNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.config = RED.nodes.getNode(n.config);
    	this.outLhsOrRhs = n.outLhsOrRhs;
    	this.in = n.in;
    	this.inType = n.inType;
    	this.inLhsOrRhs = n.inLhsOrRhs;
    	this.caseInsensitive = n.caseInsensitive;
    	this.outputLhsValues = n.outputLhsValues;
    	
    	var node = this;
    	
    	node.on("input", function(msg) {
    		try {
    			var inValue = RED.util.getMessageProperty(msg, node.in);
    			if ( inValue && node.caseInsensitive ) {
            		inValue = inValue.toLowerCase();
            	}
    			if ( inValue ) {
	    			var mapping = node.config.mappings.find(function(mapping) {
	    				var mappingValue = mapping[node.inLhsOrRhs];
	    				if ( mappingValue && node.caseInsensitive ) {
	                		mappingValue = mappingValue.toLowerCase();
	                	}
	    				return mappingValue===inValue;
	    			});
	    			if ( mapping ) {
		            	var index = node.outputLhsValues.findIndex(function(outputLhsValue) {
		            		return outputLhsValue===mapping.lhs;
		            	});
		            	if ( index > -1 ) {
			            	var msgs = new Array(node.outputLhsValues.length);
			            	msgs[index]=msg;
			            	node.send(msgs);
		            	}
	    			}
    			}
            }
            catch(err) {
                node.error(err.message, msg);
            }
    	});
		    
    }
    RED.nodes.registerType("map-switch", MapSwitchNode);
}
