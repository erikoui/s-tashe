// TODO: remove location.reload() and replace it with something
// that redraws the tags (no need to get tags from db)

// TODO: show the result of the getJSONs in a div somewhere
onload = function() {
  $('.removetag').click((e) => {
    e.preventDefault();
    $.getJSON(e.target.href, () => {
      location.reload();
    });
  });

  $('.addtag').click((e) => {
    e.preventDefault();
    $.getJSON(e.target.href, () => {
      location.reload();
    });
  });

  $('.removeallreports').click((e) => {
    e.preventDefault();
    $.getJSON(e.target.href, () => {
      location.assign('/showreports');
    });
  });

  const picid=document.getElementById('picid').innerText;
  document.getElementById('picid').innerText='';
  $.getJSON('/API/getReports?picid='+picid, function(data) {
    for (let i = 0; i < data.length; i++) {
      const reprot = document.createElement('li');
      reprot.innerText = data[i].rtype+': '+data[i].details;
      document.getElementById('reports').appendChild(reprot);
    }
    $('#loading').text('');
  });
};
