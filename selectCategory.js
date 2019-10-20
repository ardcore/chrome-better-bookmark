var categoryNodes = []
var wrapper
var searchWrapper
var focusedElement
var fuzzySearch
var currentNodeCount = 0
var parentClicked = false

var DOWN_KEYCODE = 40
var UP_KEYCODE = 38
var CONFIRM_KEYCODE = 13

// chrome.windows.getCurrent(function(wind) {
//   var maxWidth = window.screen.availWidth;
//   var maxHeight = window.screen.availHeight;
//   var updateInfo = {
//     left: 0,
//     top: 0,
//     width: maxWidth,
//     height: maxHeight
//   };
//   console.log(wind);
//   //// chrome.windows.update(wind.id, updateInfo);
// });

function filterRecursively(nodeArray, childrenProperty, filterFn, results) {
  results = results || []

  nodeArray.forEach(function(node) {
    if (filterFn(node)) {
      results.push(node)
    }
    if (node.children) {
      filterRecursively(node.children, childrenProperty, filterFn, results)
    }
  })

  return results
}

function getFullPathRecursively(el, node, titles) {
  var currentNode = node

  if (currentNode && currentNode.parentId) {
    var getParentNode = chrome.bookmarks.get(currentNode.parentId, function(
      parentNode
    ) {
      if (parentNode[0] && parentNode[0].parentId > 0) {
        titles.unshift(parentNode[0].title)
        currentNode = parentNode[0]
        getFullPathRecursively(el, currentNode, titles)
      } else {
        setTimeout(function() {
          el.setAttribute('data-tooltip', titles.join(' > '))
        }, 0)
      }
    })
  }
}

function createUiElement(node, captions = true) {
  var el = document.createElement('div')
  el.setAttribute('data-id', node.id)
  el.setAttribute('data-count', node.children.length)
  el.setAttribute('data-title', node.title)
  el.setAttribute('data-parent-id', node.parentId)
  el.classList.add('bookmark')
  if (captions && node && node.parentId) {
    var getParentNode = chrome.bookmarks.get(node.parentId, function(
      parentNode
    ) {
      if (parentNode[0] && parentNode[0].parentId > 0) {
        getFullPathRecursively(el, node, [])
      }
    })
  }
  // TODO: get position of the tooltip from the extension options and pass it over here
  el.setAttribute('data-tooltip-position', 'bottom') // position of the tooltip
  el.innerHTML = "<span class='bookmarks__title'>" + node.title + '</span>'
  el = appendRadioButtonParentSelector(el, node.parentId)
  return el
}

function getBreadcrumbByStartingNode(el, node, links) {
  var currentNode = node
  if (!currentNode || !currentNode.parentId) {
    return
  }
  var getParentNode = chrome.bookmarks.get(currentNode.parentId, function(
    parentNode
  ) {
    if (currentNode && parentNode[0] && parentNode[0].parentId > 0) {
      if (links.length <= 0) {
        links.unshift(currentNode)
      }
      links.unshift(parentNode[0])
      currentNode = parentNode[0]
      getBreadcrumbByStartingNode(el, currentNode, links)
    } else {
      // on click on the root node, which is already saved in the "currentNode"
      if (links.length <= 1) {
        links.unshift(currentNode)
      }
      var activeClass = ''
      setTimeout(function() {
        for (var i = 0; i < links.length; i++) {
          if (i === links.length - 1) {
            activeClass = ' current-node'
          }
          links[
            i
          ] = `<a class='breadcrumb__link${activeClass}' data-id-link='${links[i].id}'>${links[i].title}</a>`
        }
        if (el.firstChild) {
          el.removeChild(el.firstChild)
        }
        el.innerHTML =
          "<p class='bookmarks__parent-chosen'><b>" +
          links.join(' > ') +
          '</b></p>'

        // generate links for all breadcumb's nodes
        var createdBreadcrumb = document.querySelector(
          '.bookmarks__parent-chosen'
        )
        if (createdBreadcrumb) {
          createdBreadcrumb.addEventListener('click', handleBreadcrumbLink)
        }
      }, 0)
    }
  })
}

function showFullPathOfParentDir(parentSelected, breadcrumbSeparator = '') {
  if (parentSelected === null) {
    return
  }

  var dirName = parentSelected.getAttribute('data-title')
  var dirId = parentSelected.getAttribute('data-id')

  var outputFooter = document.querySelector('.bookmarks__parents-output')
  if (!outputFooter.classList.contains('visible')) {
    outputFooter.classList.add('visible')
  }

  var output = document.querySelector('.bookmarks__breadcrumb')
  if (output !== null && dirId) {
    if (breadcrumbSeparator) {
      // remove old event listeners, as the breadcumb will be rerendered
      var linksInOutput = document.querySelector('.bookmarks__parent-chosen')
      if (linksInOutput) {
        linksInOutput.removeEventListener('click', handleBreadcrumbLink)
      }
      var getParentNode = chrome.bookmarks.get(dirId, function(parentNode) {
        if (parentNode[0] && parentNode[0].parentId > 0) {
          getBreadcrumbByStartingNode(output, parentNode[0], [])
        } else {
          output.innerHTML =
            "<p class='bookmarks__parent-chosen'><b>" + dirName + '</b></p>'
          // just rerender the tree with children
          generateTreeOfSelectedNode(dirId)
        }
      })
    } else {
      output.innerHTML =
        "<p class='bookmarks__parent-chosen'><b>" + dirName + '</b></p>'
    }
    // set value of the currently clicked radio button to the hidden input
    var hiddenInput = document.querySelector('.bookmarks__parents-hidden')
    hiddenInput.setAttribute('value', parentSelected.getAttribute('data-id'))
  }
}

function handleBreadcrumbLink(el) {
  if (event.target.nodeName.toLowerCase() !== 'a') {
    return
  }
  // switch tree (parent) to the clicked breadcumb
  var nodeId = event.target.getAttribute('data-id-link')
  var output = document.querySelector('.bookmarks__breadcrumb')

  // remove old event listeners, as the breadcumb will be rerendered
  var linksInOutput = document.querySelector('.bookmarks__parent-chosen')
  if (linksInOutput) {
    linksInOutput.removeEventListener('click', handleBreadcrumbLink)
  }

  // rerender the breadcumb itself
  if (nodeId && nodeId > 0) {
    var getParentNode = chrome.bookmarks.get(nodeId, function(parentNode) {
      if (parentNode[0] && parentNode[0].parentId > 0) {
        getBreadcrumbByStartingNode(output, parentNode[0], [])
      }
    })
  }

  // rerender the tree with children
  generateTreeOfSelectedNode(nodeId)

  /* // add breadcumb point to the search field to filter the results displayed below
    var searchInput = document.querySelector(".spotlight-searcht input");
    searchInput.value = event.target.textContent;
    searchInput.focus();
    __triggerKeyboardEvent(searchInput, 8);

    var foundFolders = document.querySelectorAll("#wrapper .bookmarks__title");
    var arrayOfFoundFolders = [];
    for (
      i = -1, l = foundFolders.length;
      ++i !== l;
      arrayOfFoundFolders[i] = foundFolders[i]
    );
    const filteredItems = query => {
      return arrayOfFoundFolders.filter(
        el => el.textContent.toLowerCase().indexOf(query.toLowerCase()) > -1
      );
    };
  */
}

/*
function __triggerKeyboardEvent(el, keyCode) {
  var eventObj = document.createEventObject
    ? document.createEventObject()
    : document.createEvent("Events");

  if (eventObj.initEvent) {
    eventObj.initEvent("keydown", true, true);
  }

  eventObj.keyCode = keyCode;
  eventObj.which = keyCode;

  el.dispatchEvent
    ? el.dispatchEvent(eventObj)
    : el.fireEvent("onkeydown", eventObj);
}
*/

function splitString(originalString, separator) {
  var arrayOfStrings = originalString.split(separator)
  for (var i = 0; i < arrayOfStrings.length; i++) {
    arrayOfStrings[i] =
      "<a class='breadcrumb__link'>" + arrayOfStrings[i] + '</a>'
  }
  return arrayOfStrings.join(' > ')
}

function generateTreeOfSelectedNode(nodeId) {
  if (nodeId) {
    chrome.bookmarks.getSubTree(nodeId, drawSubTree)
  }
}

function getDirectoriesInChildren(categoryNodes) {
  return filterRecursively(categoryNodes, 'children', function(node) {
    return !node.url && node.id > 0
  })
}

function drawSubTree(categoryNodes) {
  if (categoryNodes[0] && categoryNodes[0].children.length > 0) {
    var outputSection = document.querySelector('.bookmarks__parents-output')
    var footer = document.querySelector('.bookmarks__parents-output-footer')
    while (footer.firstChild) {
      // remove the previously generated tree first
      footer.removeChild(footer.firstChild)
    }
    footer.removeEventListener('click', handleAddBookmark)
    footer.removeEventListener('click', handleRadioButtons)

    var categoryChildren = getDirectoriesInChildren(categoryNodes[0].children)
    var elementsWithUi = []
    categoryChildren.forEach(function(node) {
      elementsWithUi.push(createUiElement(node, false))
    })

    if (categoryChildren.length > 0) {
      // If there are children, add a class to a parent to avoid showing border
      if (!outputSection.classList.contains('with-children')) {
        outputSection.classList.add('with-children')
      }

      // show children in the sub tree on toggler click
      if (!footer.classList.contains('children-hidden')) {
        footer.classList.add('children-hidden')

        // reset the toggler state after navigating to the new node
        var togglerStateChange = document.querySelector(
          '.bookmarks__parents-children-toggler'
        )
        var footer = document.querySelector('.bookmarks__parents-output-footer')
        // var footerList = footer.querySelector('ul li')
        if (
          togglerStateChange
          // &&
          // footerList &&
          // footerList.length > 0 &&
          // !footer.classList.contains('children-hidden')
        ) {
          togglerStateChange.click()
        }
      }
      // Tooltip first
      var tooltip =
        "<aside class='bookmarks__parents-create-icon'>" +
        "<img src='images/up-arrow.png' alt='" +
        chrome.i18n.getMessage('iconup') +
        "' title='" +
        chrome.i18n.getMessage('iconup') +
        "' />" +
        "</aside><p class='bookmarks__parents-text'>" +
        chrome.i18n.getMessage('anotherparentdir') +
        '</p>'

      // if there are children: i.e. subdirectories
      var footerUl = document.createElement('ul')
      var rootNodeId = categoryNodes[0].id
      var secondParent,
        currentNodeParentId,
        newEl,
        firstLevel,
        secondlevelEntered = false
      secondParent = rootNodeId
      elementsWithUi.forEach(function(element) {
        // make a tree
        currentNodeParentId = element.getAttribute('data-parent-id')
        if (currentNodeParentId !== rootNodeId) {
          var footerUlLi = document.createElement('li')
          if (currentNodeParentId === secondParent && firstLevel === true) {
            // style element differently (indented of two levels)
            if (!secondlevelEntered) {
              element.classList.add('bookmark--second-level')
              secondlevelEntered = true
            } else {
              element.classList.add('bookmark--second-level-indentation')
            }
          } else {
            firstLevel = true
            secondlevelEntered = false
            secondParent = element.getAttribute('data-id')
          }
          // append a list element (indented of one level)
          footerUlLi.appendChild(element)
          footerUl.appendChild(footerUlLi)
        } else {
          // append a root element without a list wrapper
          footerUl.appendChild(element)
          firstLevel = false
        }
      })
      // render the sub tree
      footer.appendChild(footerUl)
      footer.innerHTML += tooltip
      // add events for all bookmarks
      footer.addEventListener('click', handleAddBookmark)
      // add events for all radio buttons (parent selectors)
      footer.addEventListener('click', handleRadioButtons)
    } else {
      if (outputSection.classList.contains('with-children')) {
        outputSection.classList.remove('with-children')
      }
    }
  }
}

function appendRadioButtonParentSelector(el, parentId) {
  var theInput = document.createElement('input')
  theInput.setAttribute('type', 'radio')
  theInput.setAttribute('name', 'parents-id')
  theInput.setAttribute('class', 'bookmarks__parents-id-selector')
  theInput.setAttribute('value', parentId)
  el.appendChild(theInput)
  return el
}

function handleRadioButtons(el) {
  var parentSelected = el.target.parentNode
  var footerWrapper = el.target.closest('.bookmarks__parents-output-footer')
  if (footerWrapper) {
    // TODO: If we're in the sub tree
    if (!footerWrapper.classList.contains('sub-tree')) {
      footerWrapper.classList.add('sub-tree')
    }
    //:not(> )
  } else {
    parentClicked = true // for focusing
  }
  showFullPathOfParentDir(parentSelected, ' > ')
  generateTreeOfSelectedNode(parentSelected.getAttribute('data-id'))
}

function handleAddBookmark(e) {
  triggerClick(e.target)
}

function triggerClick(element) {
  if (element.nodeName.toLowerCase() === 'span') {
    // clicked on .bookmarks__parents-create-dir-name span
    element = element.parentNode
  }
  // else if (element.nodeName.toLowerCase() === "p") {
  //   // clicked on p.bookmarks__parents-create-dir-name
  //   element = element.parentNode;
  // }

  var categoryId = element.getAttribute('data-id')
  var newCategoryTitle

  if (categoryId == 'NEW') {
    newCategoryTitle = element.getAttribute('data-title')

    var checkedElId = document.querySelector('.bookmarks__parents-hidden')
    var selectedParentId = checkedElId.value != '' ? checkedElId.value : null
    chrome.bookmarks.create(
      {
        parentId: selectedParentId,
        title: newCategoryTitle
      },
      function(res) {
        processBookmark(res.id)
      }
    )
  } else {
    processBookmark(categoryId)
  }
}

function processBookmark(categoryId) {
  getCurrentUrlData(function(url, title) {
    if (title && categoryId && url) {
      addBookmarkToCategory(categoryId, title, url)
      window.close()
    }
  })
}

function addBookmarkToCategory(categoryId, title, url) {
  chrome.bookmarks.create({
    parentId: categoryId,
    title: title,
    url: url
  })
}

function getCurrentUrlData(callbackFn) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    callbackFn(tabs[0].url, tabs[0].title)
  })
}

function createUiFromNodes(categoryNodes) {
  wrapper.removeEventListener('click', handleRadioButtons)
  var categoryUiElements = []
  currentNodeCount = categoryNodes.length

  categoryNodes.forEach(function(node) {
    categoryUiElements.push(createUiElement(node))
  })

  categoryUiElements.forEach(function(element) {
    wrapper.appendChild(element)
  })

  wrapper.addEventListener('click', handleRadioButtons)
}

function resetUi() {
  var newDirInputWrapper = document.querySelector(
    '.bookmarks__parents-create-wrapper'
  )
  var newDirInput = newDirInputWrapper.querySelector(
    '.bookmarks__parents-create'
  )
  if (newDirInput) {
    // remove existing input field before the next update (see addCreateCategoryButton)
    newDirInputWrapper.removeChild(newDirInput)
  }
  // update the folders in the whole tree according to the entered search string
  wrapper.innerHTML = ''
}

function focusItem(index) {
  if (focusedElement) {
    focusedElement.classList.remove('focus')
  }
  focusedElement = wrapper.childNodes[index]
  if (focusedElement) {
    focusedElement.classList.add('focus')
    focusedElement.scrollIntoView(false)
  }
}

function addCreateCategoryButton(categoryName) {
  // TODO: create options
  // TODO: parse the position of the tooltip from extension's options
  var el = document.createElement('div')
  el.setAttribute('data-id', 'NEW')
  el.setAttribute('data-title', categoryName)
  el.setAttribute('data-tooltip-position', 'bottom') // set position of the tooltip
  el.classList.add('bookmarks__parents-create')
  el.setAttribute('data-tooltip', chrome.i18n.getMessage('caption'))
  el.innerHTML =
    "<span class='bookmarks__parents-create-dir-name'>" + categoryName + '</p>'
  document.querySelector('.bookmarks__parents-create-wrapper').appendChild(el)
  currentNodeCount = currentNodeCount + 1
}

function addHiddenOutput() {
  // add hidden element to output a parent directory later
  var output = document.createElement('div')
  output.setAttribute('class', 'bookmarks__parents-output')
  var breadcrumb = document.createElement('div')
  breadcrumb.setAttribute('class', 'bookmarks__breadcrumb')
  searchWrapper.appendChild(breadcrumb)

  var input = document.createElement('input')
  input.setAttribute('type', 'hidden')
  input.setAttribute('name', 'parentid')
  input.setAttribute('class', 'bookmarks__parents-hidden')
  output.appendChild(input)

  var inputCheckbox = document.createElement('input')
  inputCheckbox.setAttribute('type', 'checkbox')
  inputCheckbox.setAttribute('name', 'children-toggler')
  inputCheckbox.setAttribute('class', 'bookmarks__parents-children-toggler')
  inputCheckbox.setAttribute('title', chrome.i18n.getMessage('checkbox'))
  output.appendChild(inputCheckbox)

  var footer = document.createElement('footer')
  footer.setAttribute('class', 'bookmarks__parents-output-footer')
  output.appendChild(footer)

  return output
}

function addNewDirectoryTextAbove() {
  var newDirWrapperCaptionsAbove = document.createElement('div')
  newDirWrapperCaptionsAbove.setAttribute(
    'class',
    'bookmarks__parents-create-wrapper-desc-text'
  )
  newDirWrapperCaptionsAbove.innerHTML =
    "<aside class='bookmarks__parents-create-icon'>" +
    "<img src='images/up-arrow.png' alt='" +
    chrome.i18n.getMessage('iconup') +
    "' title='" +
    chrome.i18n.getMessage('iconup') +
    "' />" +
    '</aside><p>' +
    chrome.i18n.getMessage('new') +
    '</p>'
  return newDirWrapperCaptionsAbove
}

function addNewDirectoryTextBelow() {
  var newDirWrapperCaptionsBelow = document.createElement('div')
  newDirWrapperCaptionsBelow.setAttribute(
    'class',
    'bookmarks__parents-create-wrapper-desc'
  )
  newDirWrapperCaptionsBelow.innerHTML =
    "<aside class='bookmarks__parents-create-icon icon-right'>" +
    "<img src='images/down-arrow.png' alt='" +
    chrome.i18n.getMessage('icondown') +
    "' title='" +
    chrome.i18n.getMessage('icondown') +
    "'/>" +
    "</aside><p class='bookmarks__parents-create-dir-caption'>" +
    chrome.i18n.getMessage('chooseparent') +
    '</p>'
  return newDirWrapperCaptionsBelow
}

function addNewDirectoryClickableWrapper() {
  var newDirWrapper = document.createElement('div')
  newDirWrapper.setAttribute('class', 'bookmarks__parents-create-wrapper')
  return newDirWrapper
}

function createInitialTree() {
  chrome.bookmarks.getTree(function(t) {
    wrapper = document.getElementById('wrapper')
    searchWrapper = document.getElementById('search').parentNode

    var options = {
      shouldSort: true,
      threshold: 0.4,
      location: 0,
      distance: 100,
      maxPatternLength: 33,
      minMatchCharLength: 2,
      keys: ['title']
    }

    categoryNodes = filterRecursively(t, 'children', function(node) {
      return !node.url && node.id > 0 // include folders only
    }).sort(function(a, b) {
      return b.dateGroupModified - a.dateGroupModified
    })

    createUiFromNodes(categoryNodes)

    // wrapper.style.width = wrapper.clientWidth + "px";

    if (currentNodeCount > 0) {
      focusItem(0)
    }

    fuzzySearch = new Fuse(categoryNodes, options)

    var newDirWrapperAbove = addNewDirectoryTextAbove()
    searchWrapper.appendChild(newDirWrapperAbove)
    var newDirInputWrapper = addNewDirectoryClickableWrapper()
    searchWrapper.appendChild(newDirInputWrapper)
    var hiddenOutput = addHiddenOutput()
    wrapper.parentNode.insertBefore(hiddenOutput, wrapper)

    //var childrenToggler = document.querySelector('input[type="checkbox"]');
    var childrenToggler = hiddenOutput.querySelector(
      '.bookmarks__parents-children-toggler'
    )
    childrenToggler.addEventListener('click', toggleChildren)

    var newDirWrapperBelow = addNewDirectoryTextBelow()
    wrapper.parentNode.insertBefore(newDirWrapperBelow, wrapper)
    // Add bookmarks' clicks for the tree
    wrapper.addEventListener('click', handleAddBookmark)
    // Add a bookmarks' click to the bookmarks__parents-create-wrapper
    newDirInputWrapper.addEventListener('click', handleAddBookmark)
  })
}

function toggleChildren(e) {
  var footerDiv = document.querySelector('.bookmarks__parents-output-footer')

  if (e.target.checked == true) {
    if (footerDiv.classList.contains('children-hidden')) {
      footerDiv.classList.remove('children-hidden')
    }
  } else {
    if (!footerDiv.classList.contains('children-hidden')) {
      footerDiv.classList.add('children-hidden')
    }
  }
}

;(function() {
  var searchElement = document.getElementById('search')
  var text = ''
  var newNodes
  var index = 0

  createInitialTree()

  searchElement.addEventListener('keydown', function(e) {
    if (e.keyCode == UP_KEYCODE) {
      e.preventDefault()
      index = index - 1
      if (index < 0) {
        index = currentNodeCount - 1
      }
      focusItem(index)
    } else if (e.keyCode == DOWN_KEYCODE) {
      e.preventDefault()
      index = index + 1
      if (index >= currentNodeCount) {
        index = 0
      }
      focusItem(index)
    } else if (e.keyCode == CONFIRM_KEYCODE) {
      if (currentNodeCount > 0) {
        triggerClick(focusedElement)
      }
    } else {
      // to get updated input value, we need to schedule it to the next tick
      setTimeout(function() {
        text = document.getElementById('search').value
        if (text.length) {
          newNodes = fuzzySearch.search(text)
          resetUi()
          createUiFromNodes(newNodes)

          if (newNodes.length && parentClicked === false) {
            focusItem(0)
          }

          if (!newNodes.length || text !== newNodes[0].title) {
            addCreateCategoryButton(text)
          }
        } else {
          resetUi()
          createUiFromNodes(categoryNodes)
          if (currentNodeCount > 0) {
            focusItem(0)
          }
        }
        index = 0
      }, 0)
    }
  })

  searchElement.focus()
})()
