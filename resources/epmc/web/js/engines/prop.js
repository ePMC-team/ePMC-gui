var possibletypes = new Array('bool', 'int', 'double');

window.util.setstatus_prop = function (status) {
	$('#prop_save_lbl').html(status);
	switch (status) {
	case 'Properties Unsaved':
		$('#prop_save_lbl').removeClass();
		$('#prop_save_lbl').addClass('label label-warning');
		break;
	case 'Properties Saved':
		$('#prop_save_lbl').removeClass();
		$('#prop_save_lbl').addClass('label label-success');
		break;
	case 'Properties Opened':
		$('#prop_save_lbl').removeClass();
		$('#prop_save_lbl').addClass('label label-success');
		break;
	}
}

window.util.list_clean = function (dom) {
	var prevlen = $(dom).children().length;
	$(dom).children(':lt(' + (prevlen - 1).toString() + ')').remove();
}

window.util.load_prop = function (path) {
	var File = window.file.load(path);
	if (File != undefined) {
		window.vars.model.file_prop = File.text;
		window.vars.model.path_prop = File.path;
		window.util.reload_prop();
	} else {
		log.info("property loading cancelled.");
	}
}

window.util.reload_prop = function () {
	var lines = window.vars.model.file_prop.split('\n');
	var count = 0;
	var elem = null;
	
	function submit() {
		// put elem into the list
		if (elem == null) return;
		if (elem.formula == "") return;
		
		$('#properties-add-new').before(
			"<li class='list-group-item'>" + 
			"<input style='display:none;' class='propcbox' type='checkbox' />" + 
			"<a onclick='window.util.edit_prop(this)'>" + elem.formula + "</a></li>"
		);
		window.vars.model.list_prop.push(elem);
		elem = null;
	}
	
	// remove all the existing information about properties
	window.vars.model.list_prop = [];
	window.util.list_clean($('#properties-list'));
	window.util.list_clean($('#label-list tbody'));
	window.util.list_clean($('#constant-list tbody'));
	
	
	for (var i = 0; i < lines.length; i ++) {
		if (elem == null) elem = {
			formula: "",
			comments: ""
		};
		
		var cl = lines[i].trim();
		if (cl == "") {
			continue;
		} else if (cl.indexOf("//") == 0) {
			// this is a comment line
			elem.comments += cl.substr(2) + "\n";
		} else if (cl.indexOf("const") == 0) {
			// this is a const line
			// use filter to avoid being confused by multiple spaces
			// remove comments if there's any
			cl = cl.split('//')[0];
			cl = cl.split(' ').filter(function (elem) {
				return elem.trim() != "";
			});
			cl[2] = cl[2].replace(';', '');
			
			var cline = window.util.create_constant_line(cl[2], cl[1],possibletypes);
			$('#constant-add-new').before(cline);
		} else if (cl.indexOf("label") == 0) {
			var reg = /label\s+"(\w+)"\s*=\s*(\S+);/;
			var lbl = reg.exec(cl);
			$('#label-add-new').before(window.util.create_label_line(lbl[1], lbl[2]));
		} else {
			// othewise it can only be a formula
			cl = cl.split('//');
			elem.formula = cl[0];
			if (cl[1] != undefined) elem.comments += cl[1];
			submit();
		}
	}
	
	window.util.setstatus_prop('Properties Opened');
}

window.util.append_prop = function () {
	$('#prop-edit-remove').attr('disabled', true);
	$('#prop-edit-remove').removeClass('btn-danger').addClass('btn-disabled');
	$('textarea[name=prop-editor-formula]').val('');
	$('textarea[name=prop-editor-comments]').val('');
	
	$('#prop-editor-confirmed').unbind('click').click(function () {
		// add new property
		var elem = {
			formula: $('textarea[name=prop-editor-formula]').val(),
			comments: $('textarea[name=prop-editor-comments]').val()
		};
		
		if (elem.formula != undefined && elem.formula.trim() != "") {
			vars.model.list_prop.push(elem);
			$('#properties-add-new').before("<li class='list-group-item'><input style='display:none;' type='checkbox' /><a onclick='window.util.edit_prop(this)'>" + elem.formula + "</a></li>");
			$('#properties-panel li.tips').remove();
			window.util.setstatus_prop('Properties Unsaved');
		}
		$('#prop-edit-remove').removeClass('btn-disabled').addClass('btn-danger');
		$('#prop-editor').modal('hide');
	});
	
	$('#prop-editor').modal('show');
}

window.util.edit_prop = function (elem) {
	var index = $(elem).parent().parent().children().index($(elem).parent());
	
	$("textarea[name=prop-editor-formula]").val(vars.model.list_prop[index].formula);
	$("textarea[name=prop-editor-comments]").val(vars.model.list_prop[index].comments);
	
	$('#prop-editor-remove').unbind('click').click(function () {
		vars.model.list_prop.splice(index, 1);
		$('#properties-list li:eq(' + index.toString() + ')').remove();
		$('#prop-editor').modal('hide');
	});
	
	$('#prop-editor-confirmed').unbind('click').click(function () {
		vars.model.list_prop[index].formula = $('textarea[name=prop-editor-formula]').val();
		vars.model.list_prop[index].comments = $("textarea[name=prop-editor-comments]").val();
		$('#properties-list li:eq(' + index.toString() + ') a').html(vars.model.list_prop[index].formula);
		$('#prop-editor').modal('hide');
		window.util.setstatus_prop('Properties Unsaved');
	});
	
	$('#prop-editor').modal('show');
}

window.util.save_prop = function (saveas) {
	var text = "";
	
	// generate constants and labels
	// constants first
	var clines = $('#constant-list tbody tr');
	
	// the last line is `add constant` and should be ignored
	for (var i = 0; i < clines.length - 1; i ++) {
		text += "const " + $(clines[i]).children("td:eq(1)").children().val() + 
			" " + $(clines[i]).children("td:eq(0)").children().val() + ";\n";
	}
	
	text += "\n";
	
	// labels then
	var clines = $('#label-list tbody tr');
	for (var i = 0; i < clines.length - 1; i ++) {
		text += "label \"" + $(clines[i]).children("td:eq(0)").children().val() + 
			"\" = " + $(clines[i]).children("td:eq(1)").children().val() + ";\n";
	}
	
	text += "\n";
	
	for (var i = 0; i < vars.model.list_prop.length; i ++) {
		var comments = vars.model.list_prop[i].comments.split('\n');
		for (var j = 0; j < comments.length; j ++) {
			if (comments[j].trim() != "") text += "// " + comments[j] + "\n";
		}
		
		text += vars.model.list_prop[i].formula + "\n\n";
	}
	
	if (window.vars.model.path_prop.indexOf("[Example]") == 0) {
		saveas = true;
	}
	
	// store the property description to certain files
	var targetpath = saveas ? "" : (vars.model.path_prop || "");
	var finpath = file.save(text, targetpath);
	if (finpath != null) {
		alert('Properties Saved Successfully to ' + finpath + ".");
		window.util.setstatus_prop('Properties Saved');
		vars.model.path_prop = finpath;
	}
}

window.util.add_property = function (property) {
    vars.model.list_prop.push(property);
    $('#properties-add-new').before("<li class='list-group-item'><input style='display:none;' type='checkbox' /><a onclick='window.util.edit_prop(this)'>" + property.formula + "</a></li>");
}

window.util.get_consts = function () {
	var clines = $('#constant-list tbody tr');
	var result = {};
	for (var i = 0; i < clines.length - 1; i ++) {
		var name = $(clines[i]).children('td:eq(0)').children().val();
		var type = $(clines[i]).children('td:eq(1)').children().val();
		var val  = $(clines[i]).children('td:eq(2)').children().val();
		
		if (name == "") continue;
		if (val == "" && name != "") {
			alert('Constant <b>[' + name + ']</b> hasn\'t been assigned! You need to assign it before checking.');
			return undefined;
		}
		
		result[name] = {
			value: val,
			type: type
		};
	}
	
	return result;
}

window.util.get_labels = function () {
	var llines = $('#label-list tbody tr');
	var result = {};
	for (var i = 0; i < llines.length - 1; i ++) {
		var name = $(llines[i]).children('td:eq(0)').children().val();
		var val  = $(llines[i]).children('td:eq(1)').children().val();
		
		if (name == "") continue;
		if (val == "" && name != "") {
			alert('Label <b>[' + name + ']</b> hasn\'t been assigned! You need to assign it before checking.');
			return undefined;
		}
		
		result[name] = val;
	}
	
	return result;
}

window.util.create_constant_line = function (name, type, types) {
	var cline = '<tr>';
	cline += "<td><input type='text' value='" + name + "' /></td>";
	cline += "<td><select>";
	
	for (var j = 0; j < types.length; j ++) {
		var t = types[j];
		cline += "<option " + (t == type ? "selected" : "") + " value='" + t + "'>" + t + "</option>";
	}
	cline += "</td>";
	switch (type) {
	case 'bool':
		break;
	default:
		cline += "<td><input style='width:100%;' type='text' /></td>";
	}
	
	cline += "</tr>";
	
	return cline;
}

window.util.add_constant = function () {
	$('#constant-add-new').before(window.util.create_constant_line('', '',possibletypes));
}

window.util.create_label_line = function (name, value) {
	var result = 
		"<tr><td><input type='text' value='" + name + "' /></td>" + 
		"<td><input style='width:100%' value='" + value + "' /></td></tr>";
	return result;
}

window.util.add_label = function () {
	$('#label-add-new').before(window.util.create_label_line('', ''));
}

// dynamic bindings
$('#constant-list, #label-list').on('change', 'input,select', function() {
	window.util.setstatus_prop('Properties Unsaved');
});
