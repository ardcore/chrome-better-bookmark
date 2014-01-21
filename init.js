chrome.runtime.onStartup.addListener(function() {
  registerEvents();
});


function registerEvents() {

  chrome.bookmarks.onCreated.addListener( function(id, node) {
  })

  chrome.tabs.onActivated.addListener(function( info ) {
  })


}