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
    img.onload=function() {
      $(img).fadeIn(500);
    };
    img.style.display='none';
    return img;
  }

  /**
   * Hides the images so people cant click them
   */
  function hideImages() {
    const limg=document.getElementById('leftpic');
    const rimg=document.getElementById('rightpic');
    limg.style.display='none';
    rimg.style.display='none';
    limg.onload=function() {};
    rimg.onload=function() {};
  }

  /**
   * Adds 1 point to the point display only. points are added to the database
   * via the /vote endpoint.
   */
  function updatePoints() {
    const pointsDiv=document.getElementById('points');
    const currentPoints=parseInt(pointsDiv.innerText);
    pointsDiv.innerText=currentPoints+1;
  }
  /**
   * Show images based on the /showImages response
   */
  function loadImages() {
    $.getJSON('/showImages', function(data) {
      let voted=false;
      if (data) {
        const lpt = document.getElementById('tags1');
        const rpt = document.getElementById('tags2');
        lpt.innerHTML='';
        rpt.innerHTML='';


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
          if (!voted) {// prevent voting for both
            hideImages();
            updatePoints();
            $.getJSON(`/vote?voteid=${data.id1}&otherid=${data.id2}`, (data)=>{
              // TODO: flash a vote bar or something before the new pics load
              loadImages();
            });
          }
          voted=true;
        };
        rp.onclick = function() {
          if (!voted) {// prevent voting for both
            // hide the images
            hideImages();
            updatePoints();
            // update votes
            $.getJSON(`/vote?voteid=${data.id2}&otherid=${data.id1}`, (data)=>{
            // TODO: flash a vote bar or something before the new pics load
              loadImages();
            });
          }
          voted=true;
        };
      } else {
        console.log('error fetching images from server');
      }
    });
  }
  loadImages();
};
