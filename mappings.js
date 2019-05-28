module.exports = function(RED) {
    function MappingsConfigNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.keyName = n.keyName;
    	this.valueName = n.valueName;
    	this.mappings = n.mappings;
    	this.case = n.case;
    }
    RED.nodes.registerType("mappings-config", MappingsConfigNode);
    
    function MappingsMapNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.config = RED.nodes.getNode(n.config);
    	this.in = n.in;
    	this.inType = n.inType;
    	this.inKeyOrValue = n.inKeyOrValue;
    	this.out = n.out;
    	this.outType = n.outType;
    	this.outKeyOrValue = n.outKeyOrValue;
    	
    	var node = this;
    	
    	var mappings = !this.config.mappings ? [] : this.config.mappings.reduce(function(result, item) {
    		  result[item[node.inKeyOrValue]] = item[node.outKeyOrValue];
    		  return result;
    		}, {});
    	
    	node.on("input", function(msg) {

            try {
            	var inValue = RED.util.getMessageProperty(msg, node.in);
            	// TODO Make the default out value configurable
            	// TODO Add config property to ignore message if no match
            	var outValue = mappings[inValue] || 'Unknown ('+inValue+')';
            	RED.util.setMessageProperty(msg, node.out, outValue);
                node.send(msg);
            }
            catch(err) {
                node.error(err.message, msg);
            }
        });
    	
    }
    RED.nodes.registerType("mappings-map", MappingsMapNode);
}
