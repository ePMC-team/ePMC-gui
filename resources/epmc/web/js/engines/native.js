// rewrite some built-in functions
var confirm_result = false;

window.confirm = function (msg, func) {
	// fulfill the message
	$('#confirm .modal-body').html(msg);
	$('#confirm #confirm-confirmed').unbind('click').click(function() {
		$('#confirm').modal('hide');
		func();
	});
	$('#confirm').modal('show');
}

window.alert = function (msg, func) {
	$('#confirm .modal-body').html(msg);
	$('#confirm').modal('show');
	$('#confirm #confirm-confirmed').unbind('click').click(function() {
		$('#confirm').modal('hide');
		if (func != undefined) func();
	});
}

window.vardump = function (obj) {
	log.info(JSON.stringify(obj));
}

window.isEmptyObj = function (obj) {
	for (var k in obj) {
		if (typeof(obj[k]) != "undefined") {
			return false;
		}
	}
	
	return true;
}

window.util = {};
window.vars = {};

window.util.new_model = function() {
	
	window.vars.model.file_model = "";
	window.vars.model.path_model = "";
	
	window.util.reload_model();
}

window.util.load_model = function(path) {
	var File = window.file.load(path);
	if (File != undefined) {
		window.vars.model.file_model = File.text;
		window.vars.model.path_model = File.path;
		window.util.reload_model();
	} else {
		log.info("model loading cancelled.");
	}
}

window.util.reload_model = function() {
	if (window.vars.model.file_model == undefined) {
		log.warn("model is set to null!");
	} else {
		model_editor.setValue(window.vars.model.file_model);
		if (window.vars.model.path_model == "") {
			$('#model_title').html('untitled model');
		} else 
			$('#model_title').html(window.vars.model.path_model);
		
		$('#model_save_lbl').html('Model Opened.');
		$('#model_save_lbl').removeClass("label-warning");
		$('#model_save_lbl').addClass("label-success");
		
	}
}

window.util.save_model = function (saveas) {
	if (window.vars.model == undefined) {
		alert('Sorry but I guess you have not opened any model ...');
		return;
	}
	
	if (window.vars.model.path_model.indexOf("[Example]") == 0) {
		saveas = true;
	}
	
	var path = undefined;
	if (window.vars.model.path_model == "" || saveas) {
		var path = window.file.save(window.vars.model.file_model, "");
	} else {
		path = window.file.save(window.vars.model.file_model, window.vars.model.path_model);
	}
	
	if (path == undefined) {
		alert('unable to save model due to unknown reasons.');
		return;
	} else {
		window.vars.model.path_model = path;
		$('#model_title').html(path);
		
		$('#model_save_lbl').html('Model Saved.');
		$('#model_save_lbl').removeClass();
		$('#model_save_lbl').addClass("label label-success");
		
		alert('Model Saved Successfully to ' + path + ".");
	}
}

window.util.saveall = function () {
	window.util.save_model(false);
	window.util.save_prop(false);
}

window.util.example = function (model_name, prop_name) {
	window.vars.model.file_model = window.file.load_fromjar("epmc/web/examples/model/" + model_name);
	window.vars.model.path_model = "[Example]" + model_name;
	window.vars.model.file_prop  = window.file.load_fromjar("epmc/web/examples/property/"  + prop_name );
	window.vars.model.path_prop  = "[Example]" + prop_name;
	
	window.util.reload_model();
	window.util.reload_prop();
}

window.util.exit = function () {
	confirm('Do you confirm to exit? All the unsaved changes will lost.', function() {
		// TODO some other operations should be done before exit
		window.epmc.exit();
	});
	
	var conf = {
		options: vars.model.user_options
	}
	
	file.save(JSON.stringify(conf), epmc.CONFIG);
}

window.util.debug = function () {
	alert(epmc.ModelCheck(vars.model.file_model, vars.model.list_prop[0].formula, ''));
}

// --------------------------------------- initialization ----------------------------------

var model_editor = ace.edit('model_editor');
model_editor.setTheme("ace/theme/monokai");
model_editor.getSession().setMode("ace/mode/prism");

model_editor.on("change", function (o) {
	if (window.vars.model != undefined) {
		window.vars.model.file_model = model_editor.getValue();
	}
	
	$('#model_save_lbl').html('Model Unsaved.')
	$('#model_save_lbl').removeClass();
	$('#model_save_lbl').addClass("label label-warning");
});

window.onresize = function() {
	var h = $(window).height() - 120;
	$('#left').height(h);
	$('#right').height(h + 40);
}

$(document).ready(function() {
	var h = $(window).height() - 240;
	$('#left').height(h);
	$('#right').height(h + 40);
});

function init() {
	log.info('Initialization Starting ...');
	log.info('Log service located.');
	if (window.epmc != undefined) {
		log.info('Epmc service located.');
		
		window.onerror = function (errorMsg, url, line, col, errobj) {
			log.err("Js exception at line " + line + ", col " + col + ". Message: " + errorMsg);
		}
		
		log.info("error handler registered.")
	}
	
	if (window.file != undefined) {
		log.info('File service located.');
	}
	
	// initialize some global variables
	window.vars.model = {
		file_model : "",
		path_model : "",
		file_prop : "",
		path_prop : "",
		list_prop : [],
		user_options: {}
	};
	
	
	log.info('Native javascripts are successfully parsed!');
	window.epmc.EpmcInit();
	
	window.util.history_reload();
	log.info('History reloaded.');
	
	// reload configurations
	var fconf = file.load(epmc.CONFIG);
	if (fconf.path != null) {
		try {
			window.vars.model.user_options = JSON.parse(fconf.text).options;
			
			$('#lbl-option-status').removeClass();
			$('#lbl-option-status').addClass('label label-success');
			$('#lbl-option-status').html('Recovered.');
		} catch (e) {
			log.err('Failed to recover configs due to : ' + e.message);
		}
	}
	
	// bind events for the terminal
	$('#terminal').bind('keypress',function(event){
        if(event.keyCode == 13)      
        {
            try {
            	eval($('#terminal').val());
            } catch (e) {
            	log.info("Failed to execute js due to: " + e.message);
            }
            $('#terminal').val('');
            return false;
        }  
    });
	
	// --------------------------- DEBUG ---------------------------------
	
	// disable all button styles
	$('.btn').removeClass().addClass('btn btn-default');
}