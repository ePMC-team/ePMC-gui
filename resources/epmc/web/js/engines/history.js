window.util.history_show = function () {
	$('#history-review').modal('show');
}

window.util.history_reload = function () {
	var hfile = file.load(epmc.getHistoryList());
	var latestindex = undefined;
	
	if (hfile.path == null) {
		// history not found.
		$('#history-list').html("<li class='list-group-item'>No histories found.</li>");
	} else {
		$('#history-list').html("");
		var histories = hfile.text.split('\n');
		for (var i = histories.length - 1; i >= 0; i --) {
			if (histories[i].trim() == "") continue;
			
			histories[i] = histories[i].trim().split(' ');
			if (latestindex == undefined) latestindex = histories[i][2];
			$('#history-list').append(
				"<a class='list-group-item' target='" + histories[i][2] + "'>" + 
				histories[i][0] + " " + histories[i][1] +
				"</a>"
			);
			
		}
		
		util.history_switchto(latestindex);
	}
}

window.util.history_switchto = function (index) {

	$('#history-elem-result').html(file.load(epmc.getHistoryFolder() + epmc.getMcPrefix() + index + ".result").text);

	$('#history-elem-log').html(file.load(epmc.getHistoryFolder() + epmc.getMcPrefix() + index + ".log").text);
	
	$('#history-tab-model').html('<pre>' +
		file.load(epmc.getHistoryFolder() + epmc.getMcPrefix() + index + ".model").text +
		'</pre>');
	
	$('#history-tab-property').html('<pre>' +
			file.load(epmc.getHistoryFolder() + epmc.getMcPrefix() + index + ".prop").text +
			'</pre>');
	
	$('#history-tab-option').html('<pre>' +
			file.load(epmc.getHistoryFolder() + epmc.getMcPrefix() + index + ".option").text +
			'</pre>');
	
	// TODO options
	
	// switch to result tab
	$('#history-tab-menu a:first').tab('show');
}

$(document).ready(function() {
	$('#history-list').on("click", "a", function () {
		$('#history-list a').removeClass('active');
		$(this).addClass('active');
		util.history_switchto($(this).attr('target'));
	});
});