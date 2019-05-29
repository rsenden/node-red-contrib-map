module.exports = function(RED) {
	var mustache = require("mustache");
	
    function MapConfigNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.rhsName = n.rhsName;
    	this.lhsName = n.lhsName;
    	this.mappings = n.mappings;
    	
    	var node = this;
    	
    	/**
    	 * This function converts a mappings array to a map.
    	 * 
    	 * Parameters:
    	 * - lhsOrRhsForKey: May be either 'lhs' or 'rhs', defining whether to use the mapping LHS or RHS as the map key
    	 * - keyToLowerCase: true if key needs to be converted to lower case (for case-insensitive look-up),
    	 *                   false if the key is to be used as-is (for case-sensitive look-up)
    	 */
    	var mappingsToMap = function(lhsOrRhsForKey, keyToLowerCase) {
    		return !node.mappings ? [] : node.mappings.reduce(function(result, mapping) {
      		  var key = mapping[lhsOrRhsForKey];
      		  var value = mapping;
    		  if ( keyToLowerCase ) {
    			  key = key.toLowerCase();
    		  }
    		  result[key] = value;
    		  return result;
    		}, {});
    	}
    	
    	/**
    	 * Define maps with keys as case-sensitive or case-insensitive LHS or RHS values
    	 * and the corresponding mapping as value
    	 */
    	this.maps = {
    		lhs: {
    			caseSensitive: mappingsToMap('lhs', false),
    			caseInsensitive: mappingsToMap('lhs', true)
    		},
    		rhs: {
    			caseSensitive: mappingsToMap('rhs', false),
    			caseInsensitive: mappingsToMap('rhs', true)
    		}
    	};
    	
    	/**
    	 * Get the mapping for the given key value, matching it against either the
    	 * LHS or RHS value of the mapping, then return this mapping
    	 */
    	this.getMapping = function(lhsOrRhsForKey, keyValue, caseInsensitive) {
    		if ( caseInsensitive ) {
    			keyValue = keyValue.toLowerCase();
    		}
    		return node.maps[lhsOrRhsForKey][caseInsensitive?'caseInsensitive':'caseSensitive'][keyValue];
    	}
    	
    	/**
    	 * Get the mapping for the given key value, matching it against either the
    	 * LHS or RHS value of the mapping, then return wither the LHS or RHS value
    	 * of this mapping
    	 */
    	this.getMappingValue = function(lhsOrRhsForKey, keyValue, lhsOrRhsForValue, caseInsensitive) {
    		var mapping = node.getMapping(lhsOrRhsForKey, keyValue, caseInsensitive);
    		return !mapping ? null : mapping[lhsOrRhsForValue];
    	}
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
    	
    	node.on("input", function(msg) {
            try {
            	var inValue = RED.util.getMessageProperty(msg, node.in);
            	var outValue = node.config.getMappingValue(node.inLhsOrRhs, inValue, node.outLhsOrRhs, node.caseInsensitive);
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
            	var outValue = node.config.getMappingValue('lhs', node.from, node.outLhsOrRhs, false);
		    	if (outValue) {
		    		RED.util.setMessageProperty(msg, node.out, outValue);
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
    			var outValue = node.config.getMappingValue(node.inLhsOrRhs, inValue, 'lhs', node.caseInsensitive);
    			if ( outValue ) {
	            	var index = node.outputLhsValues.findIndex(function(outputLhsValue) {
	            		return outputLhsValue===outValue;
	            	});
	            	if ( index > -1 ) {
		            	var msgs = new Array(node.outputLhsValues.length);
		            	msgs[index]=msg;
		            	node.send(msgs);
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
