window.onbeforeunload = function () {
    return "";
}

let prevLink = "";
let currentpage = "";
let forwardLink = "";

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
    }
    else {
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

function buildURL(string) {
    string = string.split("");
    let url = "https://www.google.com/search?q=";
    for (let i = 0; i < string.length; i++) {
        if (string.i === " ") return url = `${url}%20`
        url = `${url}${string[i]}`
    }
    return url
}
function isInputBoxSelected() {
    const focusedElement = document.activeElement;

    // Check if the focused element is an input element
    const isInput = focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA';

    return isInput;
}

function LoadNewLink(url) {
    window.electron.ipcRenderer.invoke('newpage', url).then((result) => {
        prevLink = currentpage;
        currentpage = url;
        forwardLink = "";
    });

    const tabGroup = document.querySelector("tab-group");

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
            if (tabGroup.getActiveTab().getTitle() != tabGroup.getActiveTab().webview.src ||
                (tabGroup.getActiveTab().getTitle() != search.value && !isInputBoxSelected())) {
                search.value = tabGroup.getActiveTab().webview.src;
                tabGroup.getActiveTab().setTitle(tabGroup.getActiveTab().webview.src);
                currentpage = tabGroup.getActiveTab().webview.src;
            }
        }, 500);
    };

    // Start listening for 'src' changes
    listenForSrcChanges();
}

function LoadNewLink_tab(url) {
    const tabGroup = document.querySelector("tab-group");

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


bookmarks = [];

function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
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

function addpageasbookmark() {
    addBookmark(currentpage);
}

function addBookmark(url) {
    if (bookmarks.includes(url) == false) {
        const bookmarksContainer = document.getElementById('bookmarks-container');
        const bookmarkElement = document.createElement('div');
        bookmarkElement.classList.add('bookmark');
        bookmarkElement.textContent = url;

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

document.getElementById('back-btn').addEventListener('click', () => {
    if (prevLink !== "" && currentpage !== "") {
        window.electron.ipcRenderer.invoke('newpage', prevLink).then((result) => {
            forwardLink = currentpage;
            currentpage = prevLink;
            prevLink = "";
            LoadNewLink_tab(currentpage);
        });
    }
});

document.getElementById('forward-btn').addEventListener('click', () => {
    if (forwardLink !== "" && currentpage !== "") {
        window.electron.ipcRenderer.invoke('newpage', forwardLink).then((result) => {
            prevLink = currentpage;
            currentpage = forwardLink;
            forwardLink = "";
            LoadNewLink_tab(currentpage);
        });
    }
});

LoadNewLink("https://google.com/");