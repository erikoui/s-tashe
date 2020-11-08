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
    img.onload = function() {
      $(img).fadeIn(500);
    };
    img.style.display = 'none';
    return img;
  }

  /**
   * Hides the images so people cant click them
   */
  function hideImages() {
    const limg = document.getElementById('leftpic');
    const rimg = document.getElementById('rightpic');
    limg.style.display = 'none';
    rimg.style.display = 'none';
    limg.onload = function() { };
    rimg.onload = function() { };
  }

  /**
   * Adds 1 point to the point display only. points are added to the database
   * via the /vote endpoint.
   *
   * @param {String} clickedId - The id of the element to which to show the
   * notification
   */
  function updatePoints() {
    const pointsDiv = document.getElementById('points');
    if (pointsDiv) {
      const currentPoints = parseInt(pointsDiv.innerText);
      pointsDiv.innerText = currentPoints + 1;
    } else {
      $('#login-link').notify(
          'You are not logged in. Your points are not being stored.',
          'info',
      );
    }
  }
  /**
   * Show images based on the /showImages response
   */
  function renderPage() {
    $.getJSON('/showImages', function(data) {
      let voted = false;
      if (data) {
        showControls(data);
        const lpt = document.getElementById('tags1');
        const rpt = document.getElementById('tags2');
        lpt.innerHTML = '';
        rpt.innerHTML = '';

        const lp = showImage(data.image1, data.desc1, 'leftpic');
        const rp = showImage(data.image2, data.desc2, 'rightpic');

        if (data.tags1) {
          for (let i = 0; i < data.tags1.length; i++) {
            const currentTag = document.createElement('a');
            currentTag.setAttribute('type', 'button');
            currentTag.setAttribute('href', `/tag?tag=${data.tags1[i]}`);
            currentTag.setAttribute('class', 'btn btn-sm btn-default');
            currentTag.innerText = data.tags1[i];
            lpt.appendChild(currentTag);
          }
        }
        if (data.tags2) {
          for (let i = 0; i < data.tags2.length; i++) {
            const currentTag = document.createElement('a');
            currentTag.setAttribute('type', 'button');
            currentTag.setAttribute('href', `/tag?tag=${data.tags2[i]}`);
            currentTag.setAttribute('class', 'btn btn-sm btn-default');
            currentTag.innerText = data.tags2[i];
            rpt.appendChild(currentTag);
          }
        }
        lp.onclick = function() {
          if (!voted) {// prevent voting for both
            hideImages();
            updatePoints();
            $.getJSON(
                `/vote?voteid=${data.id1}&otherid=${data.id2}`,
                (data) => {
                  renderPage();
                });
          }
          voted = true;
        };
        rp.onclick = function() {
          if (!voted) {// prevent voting for both
            hideImages();
            updatePoints();
            $.getJSON(
                `/vote?voteid=${data.id2}&otherid=${data.id1}`,
                (data) => {
                  renderPage();
                });
          }
          voted = true;
        };
      } else {
        console.log('error fetching images from server');
      }
    });
  }

  /**
   * Shows buttons for reporting, changing, tagging, renaming, deleting etc
   * @param {object} data - the data from renderPage
   */
  function showControls(data) {
    // Make left panel tag buttons call
    // the /changeTagId endpoint without changing page
    $('.changetag').click((e) => {
      e.preventDefault();
      $.getJSON(e.target.href, () => {
        location.reload();
      });
    });

    $('.reporttag').click((e) => {
      e.preventDefault();
      $.getJSON(e.target.href, () => {
        location.reload();
      });
    });
    // Level 3
    // left report tag button
    const lc3 = document.getElementById('level3-controls1');
    if (lc3) {
      let changeTagBtn = document.createElement('a');
      changeTagBtn.setAttribute('type', 'button');
      changeTagBtn.setAttribute(
          'href',
          `/edittags?picid=${data.id1}&fn=${data.image1}`,
      );
      changeTagBtn.setAttribute('class', 'btn btn-sm btn-warning');
      changeTagBtn.innerText = 'Change tags';
      lc3.appendChild(changeTagBtn);

      // right report tag button
      const rc3 = document.getElementById('level3-controls2');
      changeTagBtn = document.createElement('a');
      changeTagBtn.setAttribute('type', 'button');
      changeTagBtn.setAttribute(
          'href',
          `/edittags?picid=${data.id2}&fn=${data.image2}`,
      );
      changeTagBtn.setAttribute('class', 'btn btn-sm btn-warning');
      changeTagBtn.innerText = 'Change tags';
      rc3.appendChild(changeTagBtn);
    }
  }
  renderPage();
};
