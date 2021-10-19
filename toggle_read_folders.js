const rc = window.rcmail
rc.addEventListener('listupdate', toggleReadFolders)

rc.addEventListener('init', function (evt) {
  // add a flag to remember whether we are showing the folders or not
  rc.env.hide_folders_read = false

  // remove and add the required css
  var el = document.getElementById('style-rcmToggleReadFolders')
  if (el) { el.parentNode.removeChild(el) };
  el = document.createElement('style')
  el.type = 'text/css'
  el.id = 'style-rcmToggleReadFolders'
  el.appendChild(document.createTextNode(':root{--toggleReadFolder: "\\f204"} #rcmToggleReadFolders:before{content: var(--toggleReadFolder)}'))
  document.getElementsByTagName('head')[0].appendChild(el)

  // create custom button in the taskbar down the left
  el = document.createElement('a')
  el.id = 'rcmToggleReadFolders'
  el.onclick = function (e) { return rc.command('plugin.toggle_read_folders', this) }
  var buttonText = document.createElement('span')
  buttonText.setAttribute('class', 'inner')
  buttonText.innerText = 'Hide read'
  el.appendChild(buttonText)
  rc.add_element(el, 'taskbar')
  rc.register_button('plugin.toggle_read_folders', 'rcmToggleReadFolders', 'link')
  rc.register_command('plugin.toggle_read_folders', toggleHideReadFolders, true)
})

function toggleHideReadFolders (event) {
  // invert the hide_folders_read flag as this function has been triggered
  rc.env.hide_folders_read = !rc.env.hide_folders_read

  // get the new values for the icon in the taskbar
  var el = document.documentElement
  var value = window.getComputedStyle(el).getPropertyValue('--toggleReadFolder')
  var phrase
  if (value.slice(-2).charCodeAt(0) === 61957) {
    value = '"\\f204"'
    phrase = 'Hide read'
  } else {
    value = '"\\f205"'
    phrase = 'Show read'
  }
  el.style.setProperty('--toggleReadFolder', value)
  el = document.querySelectorAll('#rcmToggleReadFolders span')[0]
  el.innerText = phrase
  toggleReadFolders(event)
}

function toggleReadFolders (event) {
  // show the apps environment variables in the console
  // console.log(rc.env);

  // get the list of mailboxes
  const mailboxlist = rc.env.mailboxes_list

  // get an updated count of unread messages
  rc.http_request('getunread', { _page: rc.env.current_page }).then(function (response) {
    // define an object of unread counts - include here any folders
    // that should always be displayed and include the current folder
    const unreadCounts = { INBOX: Infinity, Drafts: Infinity, Sent: Infinity, Junk: Infinity, Trash: Infinity }
    if (!(rc.env.mailbox in unreadCounts) && (typeof rc.env.mailbox !== 'undefined')) { unreadCounts[rc.env.mailbox] = Infinity };

    // if the unread count is larger than zero then we will keep the
    // folder otherwise forget it
    var unreadCountsKeys = Object.keys(rc.env.unread_counts)
    for (var key of unreadCountsKeys) {
      if (rc.env.unread_counts[key] > 0) {
        unreadCounts[key] = rc.env.unread_counts[key]
      }
    };
    unreadCountsKeys = Object.keys(unreadCounts)

    // if any of the folder names contains a / then it is a sub-folder
    // remember all the sub-folders as well
    var unreadFolders = []
    for (key of unreadCountsKeys) {
      while (key.includes('/')) {
        key = key.split('/').slice(0, -1).join('/')
        unreadFolders.push(key)
      };
    };

    // remove duplicates folder names and loop through each of the
    // mailboxes looking for a match
    unreadFolders = [...new Set(unreadFolders.concat(unreadCountsKeys))]
    toggleDisplay(mailboxlist, 'none')
    if (rc.env.hide_folders_read) {
      unreadFolders.forEach(foldername => {
        // get the parent element of the element that has a rel attribute
        // that matches the folder name and set its style
        var el = document.querySelectorAll(`[rel="${foldername}"]`)[0].parentElement
        // el.style.backgroundColor = 'green';
        el.style.display = 'block'
        // if this element has sub-folders then set the sub-folder list
        // element's background colour to that of the document.body
        el = el.querySelectorAll('ul')
        if (el.length > 0) {
          el[0].style.backgroundColor = window.getComputedStyle(document.getElementById('folderlist-content'), null).getPropertyValue('background-color')
        };
      })
    } else {
      toggleDisplay(mailboxlist, 'block')
    }
  })
};

function toggleDisplay (mailboxlist, which) {
  mailboxlist.forEach(mbl => {
    var el = document.querySelectorAll(`[rel="${mbl}"]`)[0].parentElement
    el.style.display = which
  })
}
