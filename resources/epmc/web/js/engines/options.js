window.util.generate_typestring = function (elem) {
	if (elem.type == 'enum') {
		var rel = 'enum {';
		for (var i = 0; i < elem.values.length; i ++) {
			if (i > 0) {
				rel += ",";
			}
			rel += elem.values[i];
		}
		rel += "}";
		return rel;
	} else return elem.type;
}

window.util.option_show = function (defaultOnly) {

	if (window.helper == undefined) {
		alert('Cannot find helper apis!');
		return;
	}
	
	
	// reset the options' panel
	$('#option-editor tbody').html('');
	
	var defaultopts = helper.options();
	for (var optname in defaultopts) {
		var opt = "<tr>";
		opt += "<td>" + optname + "</td>";
		opt += "<td>" + util.generate_typestring(defaultopts[optname]) + "</td>";
		opt += "<td>" + defaultopts[optname].default + "</td>";
		opt += "<td>" + defaultopts[optname].comment + "</td>";
		var value = defaultopts[optname].default.toString();
		
		var modified = false;
		
		if (!defaultOnly) {
			// check if there's any custom option that overwrites this one
			if (vars.model.user_options[optname] != undefined) {
				value = vars.model.user_options[optname].toString();
				modified = true;
			}
		}
		
		if (modified) {
			value = "<b style='color:red;'>" + value + "</b>";
		}
		opt += "<td>" + value + "</td>";
		opt += "</tr>";
		$('#option-editor tbody').append(opt);
	}
	
	$('#option-editor-confirmed').unbind('click').click(function () {
		$('#option-editor').modal('hide');
	});
	
	$('#option-editor').modal('show');
}

window.util.option_show_default = function () {
	window.util.option_show(true);
}

window.util.option_edit = function () {

	if (window.helper == undefined) {
		alert('Cannot find helper apis!');
		return;
	}
	
	
	// reset the options' panel
	$('#option-editor tbody').html('');
	
	var defaultopts = helper.options();
	for (var optname in defaultopts) {
		var opt = "<tr>";
		opt += "<td>" + optname + "</td>";
		opt += "<td>" + util.generate_typestring(defaultopts[optname]) + "</td>";
		opt += "<td>" + defaultopts[optname].default + "</td>";
		opt += "<td>" + defaultopts[optname].comment + "</td>";
		var value = defaultopts[optname].default;

		if (vars.model.user_options[optname] != undefined) {
			value = vars.model.user_options[optname].toString();
		}

		switch (defaultopts[optname].type) {
//		case 'enum':
//			field = "<select style='width: 95%;' name='" + optname + "'>";
//			for (var i = 0; i < defaultopts[optname].values.length; i ++) {
//				var optval = defaultopts[optname].values[i];
//				var selected = '';
//				if (value == optval) selected = "selected";
//				field += "<option " + selected + " value='" + optval + "'>" + optval + "</option>";
//			}
//			field += "</select>";
//			break;
		case 'boolean':
			field  = "<select style='width: 95%;' name='" + optname + "'>";
			field += "<option value='true' " + (value == 'true' ? "selected" : "") + " >true</option>";
			field += "<option value='false' " + (value == 'false' ? "selected" : "") + " >false</option>";
			field += "</select>";
			break;
		default:
			field = "<input name='" + optname + "' value='" + value + "' />";
		}

		opt += "<td>" + field + "</td>";
		opt += "</tr>";
		$('#option-editor tbody').append(opt);
	}
	
	$('#option-editor-confirmed').unbind('click').click(function () {
		// check and rewrite the options
		var defaultopts = helper.options();
		for (var optname in defaultopts) {
			if ($('[name=' + optname + ']').val() != defaultopts[optname].default.toString()) {
				vars.model.user_options[optname] = $('[name=' + optname + ']').val();
			} else {
				// if it is already rewritten, we have to reset
				delete vars.model.user_options[optname];
			}
		}
		

		if (!isEmptyObj(vars.model.user_options)) {
			// change label
			$('#lbl-option-status').removeClass();
			$('#lbl-option-status').addClass('label label-danger');
			$('#lbl-option-status').html('Unsaved');
		}
		$('#option-editor').modal('hide');
	});
	
	$('#option-editor').modal('show');
}

window.util.option_reset = function () {
	vars.model.user_options = {};
	
	$('#lbl-option-status').removeClass();
	$('#lbl-option-status').addClass('label label-default');
	$('#lbl-option-status').html('Default');
}

window.util.option_save = function () {
	var cont = JSON.stringify(vars.model.user_options);
	if (file.save(cont, '') != null) {
		$('#lbl-option-status').removeClass();
		$('#lbl-option-status').addClass('label label-success');
		$('#lbl-option-status').html('Saved.');
	}
}

window.util.option_load = function () {
	var conf = file.load('');
	if (conf == null) {
		log.info('Option loading cancelled.');
		return;
	}
	else {
		vars.model.user_options = JSON.parse(conf.text);
		$('#lbl-option-status').removeClass();
		$('#lbl-option-status').addClass('label label-success');
		$('#lbl-option-status').html('Loaded.');
	}
}

window.util.option_asstring = function () {
	var defaultopts = helper.options();
	var result = "";
	
	// append const values
	
	for (var name in defaultopts) {
		var value = defaultopts[name].default;
		if (name in vars.model.user_options) {
			value = vars.model.user_options[name];
			result += "--" + name + " " + value + " ";
		}
	}
	
	return result;
}