/*
 *  oxmc made this script, but doesn't care if you copy it.
 */

i = 0;
var loadingtext = setInterval(function() {
    $("#loadingtext").html("Loading" + Array((++i % 4) + 1).join("."));
    //if (i===10) clearInterval(loadingtext);
}, 500);

window.addEventListener("load", function() {
    const loader = document.querySelector(".loader");
    loader.className += " hidden";
    clearInterval(loadingtext);
    $("#loadingtext").html("Loading complete!");
    /*if ($(document).height() > $(window).height() == true) {
        iziToast.info({
            title: 'Info',
            message: "Please scroll down to see the entire launcher.",
            position: 'center',
            icon: 'fa-solid fa-info-circle',
            theme: 'light'
        });
    };*/
});