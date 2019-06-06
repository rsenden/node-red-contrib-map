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
		 * This function returns either the LHS or RHS of a given mapping,
		 * or LHS|RHS, depending on whether the lhsOrRhsOrBoth parameter is
		 * set to 'lhs', 'rhs', or 'both'.
		 */
		var getMappingValue = function(mapping, lhsOrRhsOrBoth) {
			switch (lhsOrRhsOrBoth) {
			case 'lhs': return mapping.lhs;
			case 'rhs': return mapping.rhs;
			case 'both': return mapping.lhs+'|'+mapping.rhs;
			default: throw "Unsupported lhsOrRhsOrBoth parameter value: "+lhsOrRhsOrBoth;
			}
		}

		/**
		 * This function converts a mappings array to a map.
		 * 
		 * Parameters:
		 * - lhsOrRhsOrBothForKey: May be either 'lhs', 'rhs', or 'both', defining whether to use the mapping 
		 *                         LHS or RHS as the map key, or to combine both as the map key in the format
		 *                         lhs|rhs.
		 * - keyToLowerCase: true if key needs to be converted to lower case (for case-insensitive look-up),
		 *                   false if the key is to be used as-is (for case-sensitive look-up)
		 */
		var mappingsToMap = function(lhsOrRhsOrBothForKey, keyToLowerCase) {
			return !node.mappings ? [] : node.mappings.reduce(function(result, mapping) {
				var key = getMappingValue(mapping, lhsOrRhsOrBothForKey);
				if ( keyToLowerCase ) {
					key = key.toLowerCase();
				}
				result[key] = mapping;
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
				},
				both: {
					caseSensitive: mappingsToMap('both', false),
					caseInsensitive: mappingsToMap('both', true)
				}
		};

		/**
		 * Get the mapping for the given key value. Depending on the value of lhsOrRhsOrBothForKey: 
		 * - 'lhs': Match the given key value against the LHS of the configured mappings
		 * - 'rhs': Match the given key value against the RHS of the configured mappings
		 * - 'both': Match the given key value against '[LHS]|[RHS]' of the configured mappings
		 */
		this.getMapping = function(lhsOrRhsOrBothForKey, keyValue, caseInsensitive) {
			if ( !keyValue ) { return null; }
			keyValue = String(keyValue);
			if ( caseInsensitive ) {
				keyValue = keyValue.toLowerCase();
			}
			return node.maps[lhsOrRhsOrBothForKey][caseInsensitive?'caseInsensitive':'caseSensitive'][keyValue];
		}

		/**
		 * Get the mapping for the given key value, matching it against either the
		 * LHS or RHS value of the mapping, then return wither the LHS or RHS value
		 * of this mapping
		 */
		this.getMappingValue = function(lhsOrRhsOrBothForKey, keyValue, lhsOrRhsOrBothForValue, caseInsensitive) {
			var mapping = node.getMapping(lhsOrRhsOrBothForKey, keyValue, caseInsensitive);
			return !mapping ? null : getMappingValue(mapping, lhsOrRhsOrBothForValue);
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
				var outValue = node.config.getMappingValue('both', node.from, node.outLhsOrRhs, false);
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
		this.switchValues = n.switchValues;

		var node = this;

		node.on("input", function(msg) {
			try {
				var inValue = RED.util.getMessageProperty(msg, node.in);
				var outValue = node.config.getMappingValue(node.inLhsOrRhs, inValue, 'both', node.caseInsensitive);
				if ( outValue ) {
					var msgs = new Array(node.switchValues.length);
					node.switchValues.forEach(function(switchValue, i) {
						if ( switchValue===outValue ) {
							msgs[i]=msg;
						}
					});
					node.send(msgs);
				}
			}
			catch(err) {
				node.error(err.message, msg);
			}
		});

	}
	RED.nodes.registerType("map-switch", MapSwitchNode);
}
