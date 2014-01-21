function filterRecursively(nodeArray, childrenProperty, filterFn, results) {

  results = results || [];

  nodeArray.forEach( function( node ) {
    if (filterFn(node)) results.push( node );
    if (node.children) filterRecursively(node.children, childrenProperty, filterFn, results);
  });

  return results;

};

chrome.bookmarks.getTree( function(t) {
  var wrapper = document.getElementById("wrapper");
  var categoryNodes = [];
  var categoryUiElements = [];

  categoryNodes = filterRecursively(t, "children", function(node) {
    return !node.url && node.id > 0;
  }).sort(function(a, b) {
    return b.dateGroupModified - a.dateGroupModified;
  })

  categoryNodes.forEach( function( node ) {

    categoryUiElements.push( createUiElement(node) );

  })

  categoryUiElements.forEach( function( element ) {
    wrapper.appendChild( element );
  })


  wrapper.addEventListener("click", function(e) {
    triggerClick(e.target);
  })


})

function createUiElement(node) {

  var el = document.createElement("span");
  el.setAttribute("data-id", node.id);
  el.setAttribute("data-count", node.children.length);
  el.setAttribute("data-title", node.title);
  el.innerHTML = node.title;

  return el;

}

function triggerClick(element) {
  var categoryId = element.getAttribute("data-id");
  getCurrentUrlData(function(url, title) {

    if (title && categoryId && url) {
      addBookmarkToCategory(categoryId, title, url);
      window.close();
    }

  });

}

function addBookmarkToCategory(categoryId, title, url) {

  chrome.bookmarks.create({'parentId': categoryId,
                           'title': title,
                           'url': url});
}

function getCurrentUrlData(callbackFn) {
  chrome.tabs.query({'active': true}, function (tabs) {
    callbackFn(tabs[0].url, tabs[0].title)
  });
}