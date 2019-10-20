# Tree First Bookmarks

### This fork of <a href="https://github.com/ardcore/chrome-better-bookmark">"Better Bookmark"</a> is heavily optimised for people who likes the hierarchical folders' structure in their bookmarks and wants to stick to it having tons of (organised) folders.

- Better Bookmark has been renamed to "Tree First Bookmarks" and gets a new icon from now on.
- The redesign has happened.
- Better-Bookmark-Button extension is now equipped with captions showing up the full path to the current bookmark on hovered category.
- Now you can also choose the parent directory for the new folder that is being created (in the original version all folders were put into the "Other Bookmarks" with a flat structure first).
- Another new feature — The Sub Tree — helps you to get a quick overview of sub-folders in a chosen directory (click on any radio button to activate it).
- UI has been also improved. Arrows, breadcrumb and descriptions were added, input fields and text blocks were moved to key positions.
- Fuse.js library (fuzzy search) updated to v3.3.0 and max amount of characters for the search pattern has been changed, therefore, "Pattern length is too long" error shouldn't now block the search (or bitapRegexSearch will be used instead).
- Clickable breadcrumbs allow you to change a parent directory (to go up/down the tree) by clicking on one of the links in a breadcrumb (start by clicking any radio button).

<p align="center"><img width="320" src="https://raw.githubusercontent.com/galakhov/tree-first-bookmarks/master/screenshot.png" title="Tree First Bookmarks" alt="Tree First Bookmarks"></p>

# Original chrome-better-bookmark

Chrome Extension that lets you easily add bookmarks to any category. Includes spotlight-like weighted search (http://fusejs.io) with mouse/keyboard support.

_WebStore URL of the original simplified version of this extension_: https://chrome.google.com/webstore/detail/better-bookmark/pniopfmciclllcpockpkgceikipiibol

The new advanced _Tree First Bookmarks_ extension can be found here: https://chrome.google.com/webstore/detail/tree-first-bookmarks/lempbilidejiiljkciadplnekoflbmnl

# key binding: cmd + b / ctrl + b

Chrome allows you to set your own key binding for every extension. See https://github.com/ardcore/chrome-better-bookmark/issues/1

# TODO's

- [ ] Show the location of the bookmark as the full path in the breadcrumb when a user opens the extension and the page was already bookmarked
- [ ] Add options (font size and style, focus style, key bindings, sorting options, etc.)
- [ ] Add the position variants (top or bottom) of the tooltip into the extension's options
- [ ] TBD: icon should be greyed out by default, highlighted if the page is already bookmarked
- [x] Default state of the children's toggler (if a user navigates between nodes it switches back to the disabled state)
- [x] TBD: subcategory indentation

# Thanks to

Big thanks goes to [ardcore](https://github.com/ardcore) and his initial version of open sourced repo of [chrome-better-bookmark](https://github.com/ardcore/chrome-better-bookmark)s.

The evolution of development and the pull request can be found [here](https://github.com/ardcore/chrome-better-bookmark/pull/6).

Meanwhile, I've switched to the refined 2nd version of the [tree-first-bookmarks](https://github.com/galakhov/tree-first-bookmarks-v2)
