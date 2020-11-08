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
};
