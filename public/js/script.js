/* @Doc

TODO: APIDocs-style file description.

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
	return id.substring(menuId.length, id.length);
}

// Given an absolute path, returns the corresponding tree DOM id.
function idFromPath(path) {
	return menuId + path;
}

/* @Doc

Given the full path to an APIElem, expands its branch in the API tree to
include all of its children.

TODO: apidoc comment

@End */
function expand(parentPath, isRoot) {
	// NOTE: for this to work, all nodes must contain an absolute path of the
	// form "/.../name". Note the leading forward slash.
	var url = isRoot ? "/api" : "/api/" + parentPath;
	var req = $.ajax({
		type: "GET",
		url: url + "?json"
	});

	req.fail(function() {
		console.error("Failed to expand API element: " + parentPath);
	});

	req.done(function(data) {
		var parentNode = $("#" + idFromPath(parentPath));
		var childNodes = $("<ul>");
		var children = data.children;
		for (var i = 0; i < children.length; i++) {
			var childName = children[i];
			var childNode = $("<li>");
			var childAbsolutePath = parentPath + "/" + childName;
			childNode.attr('id', idFromPath(childAbsolutePath));
			addView(childNode);
			addExpandButton(childNode);
			childNode.append($("<span>").html(childName));
			childNodes.append(childNode);
		}
		parentNode.append(childNodes);
	});
}

// Displays the APIElem with the given absolute path.
function display(path) {
	var req = $.ajax({
		type: "GET",
		url: "/api" + path,  // TODO: make sure that this works correctly with fullnames
	});

	req.fail(function() {
		console.error("Failed to display API element: " + path);
	});

	req.done(function(data) {
		var main = $("#main-content");
		main.html(data);
	});
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
	expandButton.click(function(e) {
		console.log("Clicked expand for path: " + path);
		e.stopPropagation();
		expand(path);
	});
	node.append(expandButton);
}
