window.util.label_replace = function (prop) {
	var labels = window.util.get_labels();
	if (labels == undefined || prop == undefined) return undefined;
	vardump(labels);
	
	for (var name in labels) {
		var pat = new RegExp("(\\W|^)(" + name + ")(\\W|$)", "g");
		pat.multiline = true;
		prop = prop.replace(pat, "$1" + labels[name] + "$3");
	}
	
	return prop;
}

window.util.verify = function (selectedOnly) {
	var rawmodel = vars.model.file_model;
	var rawproperty = "";
	if (selectedOnly) {
		// pick up only selected properties
		
	} else {
		// pick up all properties
		for (var i = 0; i < vars.model.list_prop.length; i ++) {
			rawproperty += vars.model.list_prop[i].formula + "\n";
		}
	}
	
	return window.util.verify_raw(rawmodel, rawproperty);
}

window.util.verify_raw = function (rawmodel, rawproperty) {
	if (rawmodel == "" || rawproperty == "") {
		alert('You need at least some model/property to perform this operation!');
		return;
	}
	
	// verify
	rawproperty = util.label_replace(rawproperty);
	// maybe there're unassigned constants or labels
	if (rawproperty == undefined) return;
	
	var constants = util.get_consts();
	if (constants == undefined) return;
	
	var CONST_PREFIX = "--const ";
	
	var constline = CONST_PREFIX;
	for (var name in constants) {
		constline += name + "=" + constants[name].value + ","
		rawproperty =
			"const " + constants[name].type + " " + name + ";\n" + rawproperty;
	}
	
	if (constline == CONST_PREFIX) {
		// which means that no constant variables are presented
		constline = "";
	}
	
	var stroptions = constline + " " + window.util.option_asstring();
	
	var result = epmc.ModelCheck(rawmodel, rawproperty, stroptions);
	
	window.util.history_reload();
	if (result == null) {
		// model checking finished properly
		// render the results
		window.util.history_show();
	} else {
		// find the exception
		alert(
			result.getMessage() + " : line " + result.getLine() + ", column " + result.getColumn(),
			function () {
				// TODO locate in the editor
				model_editor.moveCursorTo(result.getLine() - 1, result.getColumn() - 1);
				model_editor.focus();
			}
		);
	}
}

window.helper = {};

window.helper.options = function () {
	return JSON.parse(epmc.GetOptions());
}

window.helper.check = function (model, prop, options) {
	// TODO move relative functions here
}