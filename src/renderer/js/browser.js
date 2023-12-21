// Constants for element IDs
const settingsButton = document.getElementById('settings-btn');
const settingsDiv = document.getElementById('settings');
const closeButton = document.getElementById('closeButton');
const lightModeToggle = document.getElementById('lightModeToggle');
const adBlockToggle = document.getElementById('adBlockToggle');

/* Tabs */
const tabGroup = document.querySelector("tab-group");

// Event listeners for settings button and close button
settingsButton.addEventListener('click', toggleSettings);
closeButton.addEventListener('click', toggleSettings);

// Function to toggle display of settings
function toggleSettings() {
    if (settingsDiv.style.display === 'none') {
        settingsDiv.style.display = 'block';
    } else {
        settingsDiv.style.display = 'none';
    }
}
toggleSettings();

// Event listeners for light mode and ad block toggles
lightModeToggle.addEventListener('change', toggleLightMode);
adBlockToggle.addEventListener('change', toggleAdBlock);

// Function to toggle light mode
function toggleLightMode() {
    const body = document.body;
    const lightModeToggle = document.getElementById('lightModeToggle');

    if (lightModeToggle.checked) {
        body.classList.add('light-mode');
        localStorage.setItem('lightMode', 'on');
        applyLightModeStyles(tabGroup?.shadowRoot);
    } else {
        body.classList.remove('light-mode');
        localStorage.setItem('lightMode', 'off');
        removeLightModeStyles(tabGroup?.shadowRoot);
    }
}

// Function to apply light mode styles within tabGroup.shadowRoot
function applyLightModeStyles(root) {
    if (!root) return;
    root.querySelectorAll('*').forEach(element => {
        element.classList.add('light-mode');
    });
}

// Function to remove light mode styles within tabGroup.shadowRoot
function removeLightModeStyles(root) {
    if (!root) return;
    root.querySelectorAll('*').forEach(element => {
        element.classList.remove('light-mode');
    });
}

// Function to enable ad block
function enableAdBlock() {
    localStorage.setItem('adBlock', 'on');
    ipc.invoke('adblock', true).then(() => {
        console.log('Ad block enabled');
    });
}

// Function to disable ad block
function disableAdBlock() {
    localStorage.setItem('adBlock', 'off');
    ipc.invoke('adblock', false).then(() => {
        console.log('Ad block disabled');
    });
}

// Check and set default values for toggles based on localStorage
document.addEventListener('DOMContentLoaded', function () {
    const lightModeToggle = document.getElementById('lightModeToggle');
    const adBlockToggle = document.getElementById('adBlockToggle');

    // Set default value for light mode toggle
    const savedLightMode = localStorage.getItem('lightMode');
    lightModeToggle.checked = savedLightMode === 'on';
    toggleLightMode();

    // Set default value for ad block toggle
    const savedAdBlock = localStorage.getItem('adBlock');
    adBlockToggle.checked = savedAdBlock === 'on';
    toggleAdBlock();
});

// Function to handle ad block toggle
function toggleAdBlock() {
    adBlockToggle.checked ? enableAdBlock() : disableAdBlock();
}

// Window unload event
window.onbeforeunload = function () {
    return '';
}

// Variables for page history
let prevLink = '';
let currentpage = '';
let forwardLink = '';

// Search form event listener
document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var searchValue = document.getElementById('search-input').value;
    searchValue = normalizeSearchValue(searchValue);
    LoadNewLink(searchValue);
});

// Function to normalize search value
function normalizeSearchValue(value) {
    // Trim leading and trailing whitespaces
    const trimmedValue = value.trim();

    // Check if the input is a valid URL
    const isURL = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(trimmedValue);

    // If it's a valid URL, return as is; otherwise, perform a search
    return isURL ? trimmedValue : buildURL(trimmedValue);
}


// Function to build search URL
function buildURL(string) {
    return `https://www.google.com/search?q=${encodeURIComponent(string)}`;
}

// Function to check if an input box is selected
function isInputBoxSelected() {
    const focusedElement = document.activeElement;
    const isInput = focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA';
    return isInput;
}

// Function to load a new link
function LoadNewLink(url) {
    ipc.invoke('newpage', url).then((result) => {
        prevLink = currentpage;
        currentpage = url;
        forwardLink = "";
    });

    const tab = tabGroup.addTab({
        title: url,
        src: url,
        //iconURL: new URL(url).origin + '/favicon.ico'
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
            } else if (!isInputBoxSelected()) {
                search.value = "";
                currentpage = "";
            }
        }, 500);
    };

    // Start listening for 'src' changes
    listenForSrcChanges();
}

// Function to load a new link in a tab
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
            //iconURL: new URL(url).origin + '/favicon.ico'
        });

        // Activate the newly created tab
        tab.activate();

        // Function to update tab title when 'src' changes
        const updateTabTitle = (newSrc) => {
            tab.setTitle(newSrc);
        };
    }
}

// Bookmarks array
let bookmarks = [];

// Function to save bookmarks to localStorage
function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

// Function to add the current page as a bookmark
function addpageasbookmark() {
    addBookmark(currentpage);
}

// Function to add a bookmark
function addBookmark(url) {
    if (bookmarks.includes(url) == false) {
        const bookmarksContainer = document.getElementById('bookmarks-container');
        bookmarksContainer.style.display = "";
        const bookmarkElement = document.createElement('div');
        bookmarkElement.classList.add('bookmark');
        bookmarkElement.textContent = url.substring(0, 25);

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

// Function to load bookmarks from localStorage
function loadBookmarks() {
    const storedBookmarks = localStorage.getItem('bookmarks');
    if (storedBookmarks) {
        document.getElementById('bookmarks-container').style.display = "";
        var savedbookmarks = JSON.parse(storedBookmarks);
        savedbookmarks.forEach(bookmark => {
            addBookmark(bookmark);
        });
    } else {
        document.getElementById('bookmarks-container').style.display = "none";
    }
}

// Other buttons, reload, back, forward, etc.
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

// Set default new tab
tabGroup.setDefaultTab({
    title: 'Google Search',
    src: 'https://google.com/',
    active: true,
    //iconURL: 'https://google.com/favicon.ico'
});

document.addEventListener('DOMContentLoaded', function () {
    /*setInterval(() => {
        // Get all elements with the class "tab-icon"
        const tabIcons = document.querySelectorAll('.tab-icon img');
        console.log(tabIcons);

        // Iterate through each tab icon image
        tabIcons.forEach(imgElement => {
            console.log(imgElement);
            // Add the onerror event listener to handle image load errors
            imgElement.onerror = function () {
                // Replace the broken image with a placeholder or a default image
                imgElement.src = 'path/to/placeholder.png'; // Replace with your placeholder image URL
            };
        });
    }, 1000);*/
    loadBookmarks();
    // Check if no tabs exist, if so create a new one
    if (currentpage == '') {
        console.log("No tabs");
        tabGroup.addTab();
    };
});