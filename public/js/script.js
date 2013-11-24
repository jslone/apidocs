/* @Doc

TODO: APIDocs-style file description.
TODO: add refresh button to remake tree/refresh automatically on upload
TODO: jQuery may not like / in IDs

@End */

$(document).ready(function() {
	initNavMenu();
});

// Any node on the nav menu tree will have an ID of "nav-menu<full path>".
var menuId = "nav-menu";

/* @Doc

Prefills the navigation menu with links to the apielems for all supported
languages.

TODO: APIDocs-style function description.

@End */
function initNavMenu() {
	expand("", true);
}

// Given the id of a tree DOM element, get the absolute path to the
// corresponding APIElem.
function pathFromId(id) {
	return id.substring(menuId.length, id.length).replace(/(\\)/g,"").replace(/(\.)/g,"/");
}

// Given an absolute path, returns the corresponding tree DOM id.
function idFromPath(path) {
	return menuId + path.replace( /(\/)/g,".");
}

/* @Doc

Given the full path to an APIElem, expands its branch in the API tree to
include all of its children.

TODO: apidoc comment

@End */
function expand(parentPath, isRoot) {
	console.log("Expanding path: " + parentPath);

	var url = isRoot ? "/api" : "/api/" + parentPath;
	var req = $.ajax({
		type: "GET",
		url: url + "?json"
	});

	req.fail(function() {
		console.error("Failed to expand API element: " + parentPath);
	});

	req.done(function(data) {
		var parentNode = $("#" + idFromPath(parentPath).replace( /(:|\.|\[|\])/g, "\\$1" ));
		var childNodes = $("<ul>");
		var children = data.children;
		for (var i = 0; i < children.length; i++) {
			var childName = children[i];
			var childNode = $("<li>");
			var childAbsolutePath = isRoot ? childName : parentPath + "/" + childName;
			childNode.attr('id', idFromPath(childAbsolutePath));
			addExpandButton(childNode);
			childNode.append($("<a href='/api/" + childAbsolutePath + "'>").html(childName));
			childNodes.append(childNode);
		}
		parentNode.append(childNodes);
	});
}

// Remove the branch below the nav menu branch corresponding to the given path.
function collapse(path) {
	console.log("Collapsing path: " + path);
	var node = $("#" + idFromPath(path).replace( /(:|\.|\[|\])/g, "\\$1" ));
	console.log(node);
	node.children().remove("ul");
}

// Displays the APIElem with the given absolute path.
function display(path) {
	redirect('/api' + path);
}

// Given a node in the nav menu tree, configures it such that, when clicked, it
// will display the corresponding API information.expand to show its children.
function addView(node) {
	var path = pathFromId(node.attr('id'));
	node.click(function() {
		console.log("Clicked view for path: " + path);
		display(path);
	});
}

// Given a node in the nav menu tree, adds a button to it which will add its
// children to the tree when clicked.
function addExpandButton(node) {
	// TODO: pretty buttons?
	var expandButton = $("<button>");
	expandButton.html("+");
	var path = pathFromId(node.attr('id'));
	var expanded = false;
	expandButton.click(function(e) {
		console.log("Clicked expand for path: " + path);
		e.stopPropagation();
		if (expanded) {
			collapse(path);
		} else {
			expand(path);
		}
		expanded = !expanded;
	});
	node.append(expandButton);
}
