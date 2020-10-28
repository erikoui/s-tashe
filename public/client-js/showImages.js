onload = function() {
  /**
   * loads an image to the img tag given by id
   * @param {string} src - src
   * @param {string} alt - alt
   * @param {string} id -img html tag id (where to "put" the image)
   *
   * @return {any} the image element
   */
  function showImage(src, alt, id) {
    const img = document.getElementById(id);
    img.src = src;
    img.alt = alt;
    return img;
  }

  // Show images based on the /showImages response
  $.getJSON('/showImages', function(data) {
    if (data) {
      const lpt = document.getElementById('tags1');
      const rpt = document.getElementById('tags2');
      const lp = showImage(data.image1, data.desc1, 'leftpic');
      const rp = showImage(data.image2, data.desc2, 'rightpic');

      if (data.tags1) {
        for (let i = 0; i < data.tags1.length; i++ ) {
          const currentTag=document.createElement('a');
          currentTag.setAttribute('type', 'button');
          currentTag.setAttribute('href', `/tag?tag=${data.tags1[i]}`);
          currentTag.setAttribute('class', 'btn btn-sm btn-default');
          currentTag.innerText=data.tags1[i];
          lpt.appendChild(currentTag);
        }
      }
      if (data.tags2) {
        for (let i = 0; i < data.tags2.length; i++ ) {
          const currentTag=document.createElement('a');
          currentTag.setAttribute('type', 'button');
          currentTag.setAttribute('href', `/tag?tag=${data.tags2[i]}`);
          currentTag.setAttribute('class', 'btn btn-sm btn-default');
          currentTag.innerText=data.tags2[i];
          rpt.appendChild(currentTag);
        }
      }
      lp.onclick = function() {
      // TODO: vote here and reload pics
        alert('clicked left!!');
      };
      rp.onclick = function() {
      // TODO: vote here and reload pics
        alert('clicked right!!');
      };
    } else {
      console.log('error fetching images from server');// this is a browser log
    }
  });
};
