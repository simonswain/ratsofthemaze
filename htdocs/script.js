document.addEventListener('DOMContentLoaded', function (event) {
  var els = document.getElementsByTagName('audio');
  for(var i=0, ii = els.length; i<ii; i++){
    els[i].addEventListener('play', function (e) {
      ga('send', 'event', 'Audio', e.type, e.target.currentSrc);
    });
  }
});
