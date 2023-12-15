/* NODE MODULES */
const { app } = require('@electron/remote');
const path = require('path');
const fs = require('fs');

/* Info about app */
var appdir = app.getAppPath();
var appname = app.getName();
var appversion = app.getVersion();
const config = require(`${appdir}/src/data/config.json`);
const userDataPath = app.getPath('userData');
var packageJson = require(path.join(appdir, 'package.json'));

/* About */
var contrib = require(`${appdir}/src/data/contributors.json`);
var appAuthor = packageJson.author.name;
var stringContributors = appAuthor;
var appContributors;
if (Array.isArray(contrib.contributors) && contrib.contributors.length) {
    appContributors = contrib.contributors;
    stringContributors = appContributors.join(', ');
};
var appYear = '2023'; /* The year since this app exists */
var currentYear = new Date().getFullYear();
/* Year format for copyright */
var copyYear = `${appYear}-${currentYear}`;
if (appYear == currentYear) {
    copyYear = appYear;
};

/* TEMPLATES: */
const abouttemplate = {
    badge: function (type, color) {
        var style, cssstyle;
        if (typeof color != 'undefined') {
            style = color;
            cssstyle = `style="background: var(--bs-${color});"`;
        } else {
            style = "info";
        };
        return `<span class="badge bg-${style}" ${cssstyle}>${type}</span>`;
    },
    div: function (json) {
        return `<div><p>${json.name}: ${json.desc}</p></div>`;
    }
};

/* MAIN: */
$("#appver").html(`Application Version: ${appversion}`);
(async () => {
    console.log("Generating contrib divs");
    var count = 1;
    try {
        for (var i = 0; i < appContributors.length; i++) {
            $("#appcontrib").css("display", "block");
            //console.log(i);
            //console.log(appContributors[i]);
            contribtemp = appContributors[i];
            contribtemp.desc = contribtemp.desc.replace(/(?:\r\n|\r|\n)/g, '<br>');
            if (contribtemp.method != null && contribtemp.method != "" && contribtemp.method != "undefined") {
                contribtemp.utype = contribtemp.method;
            } else {
                contribtemp.utype = "View link";
            };
            contribtemp.type = abouttemplate.badge(contribtemp.type);
            contribtemp.badge = abouttemplate.badge(contribtemp.date);
            card = abouttemplate.div(contribtemp);
            //console.log(card);
            $(`#appcontribdiv`).append(card);

            if (count == 3) {
                break;
            } else {
                count++;
            };
        };
    } catch (e) { };
})();