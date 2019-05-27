module.exports = function(RED) {
    function MapConfigNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.mappings = n.mappings;
    	this.case = n.case;
    }
    RED.nodes.registerType("map-config", MapConfigNode);
    
    function MapNode(n) {
    	RED.nodes.createNode(this, n);
    	this.name = n.name;
    	this.config = RED.nodes.getNode(n.config);
    	this.in = n.in;
    	this.inType = n.inType;
    	this.out = n.out;
    	this.outType = n.outType;
    	
    	var node = this;
    	
    	var mappings = !this.config.mappings ? [] : this.config.mappings.reduce(function(result, item) {
    		  result[item.in] = item.out;
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
    RED.nodes.registerType("map", MapNode);
}
