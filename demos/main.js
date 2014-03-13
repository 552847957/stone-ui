var Log = {
	out: function(ret) {
		$('#console').append('-> ' + ret + '</p>');
	}
};

$(function () {
	var source = $('#script')[0].text;
	$('#source').html(source);
});