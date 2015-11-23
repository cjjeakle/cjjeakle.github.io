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

function setStyleByClass(objClass, style)
{
	elts = findByClass(objClass, null, null);
	for (i = 0; i < elts.length; i++)
	{	
		elts[i].style.cssText = style;
	}
}





