/* Tabs */
const tabGroup = document.querySelector("tab-group");

/* Settings */
const settingsButton = document.getElementById('settings-btn');
settingsButton.addEventListener('click', toggleSettings);
function toggleSettings() {
    const settingsDiv = document.getElementById('settings');
    const settingsButton = document.getElementById('settings-btn');

    if (settingsDiv.style.display === 'none') {
        settingsDiv.style.display = 'block';
    } else {
        settingsDiv.style.display = 'none';
    }
}
// Event listener for the close button within the settings menu
const closeButton = document.getElementById('closeButton');
closeButton.addEventListener('click', toggleSettings);
toggleSettings();

/* Devtools */
function enabledevtools() {
    ipc.invoke('inspector', true).then((result) => {
    });
}

function disabledevtools() {
    ipc.invoke('inspector', false).then((result) => {
    });
}
function devtools() {
    const toggle = document.getElementById('devconsole');
    if (toggle.checked) {
        enabledevtools();
    } else {
        disabledevtools();
    }
}

// Function to toggle light mode
function toggleLightMode() {
    const body = document.body;
    const lightModeToggle = document.getElementById('lightModeToggle');

    if (lightModeToggle.checked) {
        body.classList.add('light-mode');
        localStorage.setItem('lightMode', 'on');

        if (tabGroup) {
            const shadowRoot = tabGroup.shadowRoot;

            // Example: Apply light mode styles to all elements within shadowRoot
            applyLightModeStyles(shadowRoot);
        }
    } else {
        body.classList.remove('light-mode');
        localStorage.setItem('lightMode', 'off');
        if (tabGroup) {
            const shadowRoot = tabGroup.shadowRoot;
            removeLightModeStyles(shadowRoot);
        }
    }
}
// Function to add light mode styles within tabGroup.shadowRoot
function applyLightModeStyles(root) {
    if (!root) return;
    // Apply light mode styles to elements within shadowRoot
    // Example:
    root.querySelectorAll('*').forEach(element => {
        element.classList.add('light-mode');
    });
}

// Function to enable ad block
function enableAdBlock() {
    localStorage.setItem('adBlock', 'on');
    ipc.invoke('adblock', true).then((result) => {
        console.log('Ad block enabled');
    });
}

// Function to disable ad block
function disableAdBlock() {
    localStorage.setItem('adBlock', 'off');
    ipc.invoke('adblock', false).then((result) => {
        console.log('Ad block disabled');
    });
}

// Check and set the default values for toggles based on localStorage
document.addEventListener('DOMContentLoaded', function () {
    const lightModeToggle = document.getElementById('lightModeToggle');
    const adBlockToggle = document.getElementById('adBlockToggle');

    // Set default value for light mode toggle
    const savedLightMode = localStorage.getItem('lightMode');
    if (savedLightMode === 'on') {
        lightModeToggle.checked = true;
        toggleLightMode();
    } else {
        lightModeToggle.checked = false;
        toggleLightMode();
    }

    // Set default value for ad block toggle
    const savedAdBlock = localStorage.getItem('adBlock');
    if (savedAdBlock === 'on') {
        adBlockToggle.checked = true;
        enableAdBlock();
    } else {
        adBlockToggle.checked = false;
        disableAdBlock();
    }
});
// Function to handle ad block toggle
function toggleAdBlock() {
    const adBlockToggle = document.getElementById('adBlockToggle');

    if (adBlockToggle.checked) {
        enableAdBlock();
    } else {
        disableAdBlock();
    }
}

window.onbeforeunload = function () {
    return "";
}

let prevLink = "";
let currentpage = "";
let forwardLink = "";

/* Search */
document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var searchValue = document.getElementById('search-input').value;
    var urlPattern = /(?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/\S*)?/gi;
    if (urlPattern.test(searchValue)) {
        if (!searchValue.includes("file://")) {
            if (!searchValue.includes("http") && !searchValue.includes("https")) {
                if (searchValue.includes("http") && !searchValue.includes("https")) {
                    searchValue = "http://" + searchValue;
                }
                else {
                    searchValue = "https://" + searchValue;
                }
            }
        }
    } else {
        var ipAddressPattern = /^(\d{1,3}\.){3}\d{1,3}(?::\d+)?$/
        var withoutProtocol = searchValue.replace("http://", "").replace("https://", "");
        if (ipAddressPattern.test(withoutProtocol)) {
            if (searchValue.includes("http") && !searchValue.includes("https")) {
                searchValue = "http://" + withoutProtocol;
            }
            else {
                searchValue = "https://" + withoutProtocol;
            }
        } else {
            searchValue = buildURL(searchValue);
        }
    }

    LoadNewLink(searchValue);
});
/* Build search url */
function buildURL(string) {
    return `https://www.google.com/search?q=${encodeURIComponent(string)}`;
}

function isInputBoxSelected() {
    const focusedElement = document.activeElement;
    // Check if the focused element is an input element
    const isInput = focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA';
    return isInput;
}

/* Load link function */
function LoadNewLink(url) {
    ipc.invoke('newpage', url).then((result) => {
        prevLink = currentpage;
        currentpage = url;
        forwardLink = "";
    });

    const tab = tabGroup.addTab({
        title: url,
        src: url,
    });

    // Activate the tab
    tab.activate();

    // Function to update tab title when 'src' changes
    const updateTabTitle = (newSrc) => {
        tab.setTitle(newSrc); // Set tab title to match the new 'src'
    };

    // Function to listen for changes in 'src'
    const listenForSrcChanges = () => {
        const interval = setInterval(() => {
            const search = document.getElementById('search-input');
            if (tabGroup.getActiveTab() != null) {
                const length = 25;
                const tabtitle = tabGroup.getActiveTab().getTitle().substring(0, length);
                const tabsrc = tabGroup.getActiveTab().webview.src.substring(0, length);
                if (tabtitle != tabsrc ||
                    (tabtitle != search.value.substring(0, length) && !isInputBoxSelected())) {
                    search.value = tabGroup.getActiveTab().webview.src;
                    tabGroup.getActiveTab().setTitle(tabsrc);
                }
                if (currentpage != tabGroup.getActiveTab().webview.src) {
                    prevLink = currentpage;
                    currentpage = tabGroup.getActiveTab().webview.src;
                }
            }
            else if (!isInputBoxSelected()) {
                search.value = "";
                currentpage = "";
            }
        }, 500);
    };

    // Start listening for 'src' changes
    listenForSrcChanges();
}

function LoadNewLink_tab(url) {
    // Check if a tab with the same URL already exists
    const existingTab = tabGroup.getTabs().find(tab => tab.webview.src === url);
    console.log(existingTab);
    if (existingTab) {
        // If the tab already exists, activate it
        existingTab.activate();
    } else {
        // If the tab doesn't exist, create a new one
        const tab = tabGroup.addTab({
            title: url,
            src: url,
        });

        // Activate the newly created tab
        tab.activate();

        // Function to update tab title when 'src' changes
        const updateTabTitle = (newSrc) => {
            tab.setTitle(newSrc);
        };
    }
}

/* Bookmarks */
bookmarks = [];
function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}
function addpageasbookmark() {
    addBookmark(currentpage);
}

function addBookmark(url) {
    if (bookmarks.includes(url) == false) {
        const bookmarksContainer = document.getElementById('bookmarks-container');
        const bookmarkElement = document.createElement('div');
        bookmarkElement.classList.add('bookmark');
        bookmarkElement.textContent = url.substring(0, 25);;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '❌';
        deleteButton.classList.add('delete-button');

        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const index = bookmarks.indexOf(url);
            if (index !== -1) {
                bookmarks.splice(index, 1);
                saveBookmarks();
                bookmarksContainer.removeChild(bookmarkElement);
            }
        });

        bookmarkElement.appendChild(deleteButton);
        bookmarks.push(url);
        saveBookmarks();
        bookmarkElement.addEventListener('click', () => {
            LoadNewLink(url);
        });
        bookmarksContainer.appendChild(bookmarkElement);
    }
}
function loadBookmarks() {
    const storedBookmarks = localStorage.getItem('bookmarks');
    if (storedBookmarks) {
        var savedbookmarks = JSON.parse(storedBookmarks);
        savedbookmarks.forEach(bookmark => {
            addBookmark(bookmark);
        });
    }
}
loadBookmarks();

/* Other buttons, reload back forward etc */
function reload() {
    if (currentpage != "") {
        const existingTab = tabGroup.getTabs().find(tab => tab.webview.src === currentpage);
        existingTab.close();
        LoadNewLink_tab(currentpage);
    }
}

document.getElementById('back-btn').addEventListener('click', () => {
    if (prevLink !== "" && currentpage !== "") {
        ipc.invoke('newpage', prevLink).then((result) => {
            forwardLink = currentpage;
            currentpage = prevLink;
            prevLink = "";
            LoadNewLink_tab(currentpage);
        });
    }
});

document.getElementById('forward-btn').addEventListener('click', () => {
    if (forwardLink !== "" && currentpage !== "") {
        ipc.invoke('newpage', forwardLink).then((result) => {
            prevLink = currentpage;
            currentpage = forwardLink;
            forwardLink = "";
            LoadNewLink_tab(currentpage);
        });
    }
});

/* Load default url */
LoadNewLink("https://google.com/");