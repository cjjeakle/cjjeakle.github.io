function findByClass(className, domNode, tagName) {
	if (domNode == null)
	{
		domNode = document;
	}
	if (tagName == null)
	{
		tagName = '*';
	}
	var elts = new Array();
	var tags = domNode.getElementsByTagName(tagName);
	var findThis = " "+className+" ";
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
	titles = findByClass('navHeader', null, null);
	elts = findByClass(obj, null, 'div');
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
	elts = findByClass(objClass, null, null);
	for (i = 0; i < elts.length; i++)
	{	
		elts[i].style.cssText = style;
	}
}





