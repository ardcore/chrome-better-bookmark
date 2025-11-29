// placeholder - will be used when options are implemented

registerEvents();

chrome.runtime.onStartup.addListener(function() {
  // Optional: any startup logic if needed, but listeners are already registered
});


function registerEvents() {

  chrome.bookmarks.onCreated.addListener( function(id, node) {
  })

  chrome.tabs.onActivated.addListener(function( info ) {
  })


}