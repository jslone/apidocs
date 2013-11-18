/* @Doc

TODO: APIDocs-style file description.

@End */

$(document).ready(function() {
	initNavMenu();
});


/* @Doc

TODO: APIDocs-style function description.

@End */
function initNavMenu() {
	var req = $.ajax({
		type: "GET",
		url: "/api",
		data: {json: undefined},
	});

	req.done(function(data) {
		// TODO: get children, make something out of them
		console.log("success");
	});

	req.fail(function() {
		console.error("Failed to initialize navigation menu.");
	})
}
