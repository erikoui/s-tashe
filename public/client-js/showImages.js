onload = function() {
  /**
   * loads an image to the img tag given by id
   * @param {string} src -src
   * @param {string} alt - alt
   * @param {string} id -img html tag id
   *
   * @return {any} the image element
   */
  function showImage(src, alt, id) {
    const img = document.getElementById(id);
    img.src = src;
    img.alt = alt;
    return img;
  }

  $.getJSON('/showImages', function(data) {
    // JSON result in `data` variable

    // TODO: load src programmatically from the /showimages endpoint
    const lp = showImage(data.image1, 'this is sample alt text', 'leftpic');
    const rp = showImage(data.image2, 'this is sample alt text', 'rightpic');
    // TODO: show tags as buttons
    lp.onclick = function() {
      // TODO: vote here and reload pics
      alert('clicked left!!');
    };
    rp.onclick = function() {
      // TODO: vote here and reload pics
      alert('clicked right!!');
    };
  });
};
