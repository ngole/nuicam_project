function trimTrailingSlash(string)
{
  if(string != null) {
    return string.replace(/\/+$/, '');
  } else {
    return string;
  }
}
if (!String.prototype.trim) {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}
ctrHref = trimTrailingSlash('https://addmap.net/'.trim());
ctrHref2 = trimTrailingSlash('https://addmap.net/'.trim());
eInDoc = function(e) {
  while (e=e.parentNode) {
   if (e==document) {
      return true;
    }
   }
   return false;
};
lCheck = function(l) {
  if (null != l && null != l.getAttribute('href') && (ctrHref === '' || trimTrailingSlash(l.getAttribute('href').trim()) == ctrHref || trimTrailingSlash(l.href.trim()) == ctrHref || trimTrailingSlash(l.getAttribute('href').trim()) == ctrHref2 || trimTrailingSlash(l.href.trim()) == ctrHref2)) {
    return true;
  }
  else {
    return false;
  }
};
linkfound = false;
window.onload = function () {
    els = document.getElementsByTagName('a');
    l = els.length;
    for (i = 0; i < l; i++) {
       el = els[i];
       if (trimTrailingSlash(el.href) === ctrHref || trimTrailingSlash(el.getAttribute('href')) === ctrHref || trimTrailingSlash(el.href) === ctrHref2 || trimTrailingSlash(el.getAttribute('href')) === ctrHref2) {
        linkfound = true;
        if(el.getAttribute('rel')=='nofollow' || !eInDoc(el) || !lCheck(el)) {
          linkfound = false;
        }
        linktext = el.innerHTML;
        if(linktext == undefined) {
          linkfound = false;
        }
        else if(linktext.trim() == '') {
          linkfound = false;
        }
        if(el.offsetHeight != undefined && el.offsetHeight < 8) {
          linkfound = false;
        }
        
        break;
      }
    }

    if(linkfound) {
  linkToHide = el;
  linkToHide.innerHTML = '';
}

    if (linkfound == false) {
      document.write('<a href="http://maps-generator.com/get-correct-widget-code?id=ca140627d70efadd80f550876699158fb9034c83">Google Maps Error: Do not change the code. Click here to show the correct code!</a>');

      widget = document.getElementById('gmap_canvas');
      if(widget) {
        widget.style.visibility = 'hidden';
      }
    }
}
