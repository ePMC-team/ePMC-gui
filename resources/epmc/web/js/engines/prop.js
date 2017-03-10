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
			
			var cline = window.util.create_constant_line(cl[2], cl[1]);
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

window.util.create_constant_line = function (name, type) {
	var cline = '<tr>';
	cline += "<td><input type='text' value='" + name + "' /></td>";
	cline += "<td><select>";
	
	for (var j = 0; j < possibletypes.length; j ++) {
		var t = possibletypes[j];
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
	$('#constant-add-new').before(window.util.create_constant_line('', ''));
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

//
// var Parameter = schema({
//     "name"      :   String,
//     "type"      :   ["int","bool","real","var"],
//     "abstract"  :   String
// });
//
// var Formula = schema({
//     "name"        :   String,
//     "description" :   String,   // MarkDown and LaTex Support
//     "abstract"    :   String,   // a short version, used as subtitle of formulae
//     "expression"  :   String,
//     "parameters"  :   Array.of(Parameter)
// });
//
// var Package = schema({
//     "name"      :   String,
//     "formulas"  :   Array.of(Formula)
// });
//
// var PackList = schema(Array.of(Package))

var pack_list = [{
    name      : "Liveness Property",
    formulas  : [{
        name          :    "simple liveness",
        description   :    "a simple liveness property",
        abstract      :    "something good will happend",
        expression    :    "F {t1}={t2}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    }]
},{
    name      : "Fairness Property",
    formulas  : [{
        name          :    "Uncoditional Fairness",
        description   :    "a simple Fairness property",
        abstract      :    "{t1}={t2} happen infinitely many times",
        expression    :    "GF {t1}={t2}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    },{
        name          :    "Strong Fairness",
        description   :    "a not so simple Fairness property",
        abstract      :    "if {t1}={t2} infinitely often then {t3}={t4} also will",
        expression    :    "GF {t1}={t2} -> GF {t3}={t4}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        },{
            name     :    "t3",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t4",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    },{
        name          :    "Weak Fairness",
        description   :    "a not so simple Fairness property",
        abstract      :    "if {t1}={t2} finally forever then {t3}={t4} also will",
        expression    :    "FG {t1}={t2} -> GF {t3}={t4}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        },{
            name     :    "t3",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t4",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    }] //formulas
},{
    name      : "Safety Property",
    formulas  : [{
        name          :    "Invariant",
        description   :    "a simple safety property",
        abstract      :    "{t1}={t2} holds in every state",
        expression    :    "G {t1}={t2}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    }]
}];
window.util.pack_idx = 0;
window.util.formula_idx = 0;
window.util.refresh_property_templates = function() {
	// var templates = // window.epmc.getTemplates
     //    [
     //        {
     //            "liveness properties":
     //                [
     //                    {
     //                        "unconditional fairness": {
     //                            "description": "...$t=a^2$...**x**, *b*...",
     //                            "abstract": "...",
     //                "formula": "..{t1}..{t2}..",
     //                "parameters": {
     //                    "t1": {
     //                        "type": "...",
     //                        "abstract": "..."
     //                    }
     //                }}
     //            ]
     //        }}
    //
     //        "safety properties": {
     //        }
	// 	};
	var lstPackage = $("#lstPackage");
	lstPackage.empty();
	pack_list.forEach(function(value,index){
        var item = $("<a class='list-group-item'></a>").text(value["name"]);
        item.click(function(){
            util.pack_idx = index;
            util.refresh_property_templates();
        });
        if(index === util.pack_idx) {
            item.addClass("active");
        }
        lstPackage.append(item);
    });

    var lstFormula =$("#lstFormula");
    lstFormula.empty();
	var formulas = pack_list[util.pack_idx]["formulas"];
    formulas.forEach(function(value,index){
        var item = $("<a class='list-group-item'></a>").text(value["name"]);
        if(index === util.formula_idx) {
            item.addClass("active");
        }
        item.click(function(){
            util.formula_idx = index;
            util.refresh_property_templates();
        });
        lstFormula.append(item);
    });

    var formula = formulas[util.formula_idx];
    var divFormulaDesc = $("#divFormulaDesc");
    divFormulaDesc.empty();
    ["description","abstract","expression"].forEach(function(key){
        divFormulaDesc.append($("<p></p>").text(formula[key]));
    });
}
