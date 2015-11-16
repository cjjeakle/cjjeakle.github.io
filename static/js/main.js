function setPageContent() {
    var pageDataPath = 'pagedata/'
    var pageParamName = 'page';

    var ignoreSeparatingCharactersRegex = '[?&;]';
    var captureParamNameRegex = '(.+?)';
    var ignoreEquealsSignRegex = '[=]';
    var captureParamValueRegex = '([^&;]+)';

    var queryValuesRegex =
        ignoreSeparatingCharactersRegex
        + captureParamNameRegex
        + ignoreEquealsSignRegex
        + captureParamValueRegex;

    var getPathValues = new RegExp(queryValuesRegex, 'g');

    var queries = {};
    var values;
    while (values = getPathValues.exec(window.location.search)) {
        queries[values[1]] = values[2];
    }

    loadPageContent(pageDataPath + queries[pageParamName]);
}

function loadPageContent(pagePath) {
    var pageDataRequest = new XMLHttpRequest();
    var pageReq = new XMLHttpRequest();
    
    pageReq.addEventListener("load", applyPageContent);
    pageReq.open("GET", pagePath, true);
    pageReq.send();
}

function applyPageContent() {
    var contentDiv = document.getelementById('content');
    contentDiv.innerHTML = this.responseText;
}


function findByClass(className, tagName) {
    if (tagName == null)
    {
        tagName = '*';
    }
    var elts = new Array();
    var tags = document.getElementsByTagName(tagName);
    var findThis = " " + className + " ";
    for(i = 0, j = 0; i < tags.length; i++) {
        var test = " " + tags[i].className + " ";
        if (test.indexOf(findThis) != -1)
        {
            elts[j++] = tags[i];
        }
    }
    return elts;
}

function toggleShow(obj)
{
    titles = findByClass('navHeader', null);
    elts = findByClass(obj, 'div');
    for (i = 0; i < elts.length; i++)
    {   
        if (titles[i].innerHTML == "Navigation ►")
        {
            titles[i].innerHTML = "Navigation &#9660";
            elts[i].style.display = "inherit";
        }
        else
        {
            titles[i].innerHTML = "Navigation &#9658"
            elts[i].style.display = "none";
        }
    }
}

function setStyleByClass(objClass, style)
{
    elts = findByClass(objClass, null);
    for (i = 0; i < elts.length; i++)
    {   
        elts[i].style.cssText = style;
    }
}

setPageContent();

