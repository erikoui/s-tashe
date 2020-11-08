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
      $(img).fadeIn(200);
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
   * Adds 1 point to the point display only. Does not add points to the
   * database.
   */
  function updatePointsDisplay() {
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
   * Loads the tags under the images.
   *
   * @param {object} data - server response from calling /showImages
   */
  function showTags(data) {
    // Tag divs
    const pt = [
      document.getElementById('tags1'),
      document.getElementById('tags2'),
    ];

    // Set tags
    for (let j=0; j<2; j++) {
      // clear tags
      pt[j].innerHTML='';
      if (data.tags[j]) {
        for (let i = 0; i < data.tags[j].length; i++) {
          const currentTag = document.createElement('a');
          currentTag.setAttribute('type', 'button');
          currentTag.setAttribute('href', `/tag?tag=${data.tags[j][i]}`);
          currentTag.setAttribute('class', 'btn btn-sm btn-default');
          currentTag.innerText = data.tags[j][i];
          pt[j].appendChild(currentTag);
        }
      }
    }
  }

  /**
   * Loads 2 images to the page and sets their click event to vote for them.
   *
   * @param {object} data - server response from calling /showImages
   */
  function showImages(data) {
    let voted = false;

    const lp = showImage(data.images[0], data.desc[0], 'leftpic');
    const rp = showImage(data.images[1], data.desc[1], 'rightpic');
    lp.onclick = ()=>{
      vote(data.ids[0], data.ids[1]);
    };
    rp.onclick = ()=>{
      vote(data.ids[1], data.ids[0]);
    };

    /**
     * calls the /vote endpoint
     * @param {int} voteid - image id to vote for
     * @param {int} otherid - the other image to increase its views
     */
    function vote(voteid, otherid) {
      if (!voted) {// prevent voting for both
        hideImages();
        updatePointsDisplay();
        $.getJSON(`/vote?voteid=${voteid}&otherid=${otherid}`, renderPage());
      }
      voted = true;
    }
  }

  /**
   * Shows buttons for reporting, changing, tagging, renaming, deleting etc
   * @param {object} data - the data from renderPage
   */
  function showControls(data) {
    // Level 3: change tags buttons
    const c=[];
    for (let i=0; i<6; i++) {
      for (let j=0; j<2; j++) {
        c[i]=[];
        c[i][j]=document.getElementById(`level${i + 1}-controls${j + 1}`);
        if (c[i][j]) {
          c[i][j].innerHTML = '';
          const controlButton = document.createElement('a');
          controlButton.setAttribute('type', 'button');
          // level 1 controls
          if (i==0) {
          }
          // level 2 controls
          if (i==1) {
          }
          // level 3 controls
          if (i==2) {
            controlButton.setAttribute(
                'href',
                `/edittags?picid=${data.ids[j]}&fn=${data.images[j]}`,
            );
            controlButton.setAttribute('class', 'btn btn-sm btn-warning');
            controlButton.innerText = 'Change tags';
            c[i][j].appendChild(controlButton);
          }
          // level 4 controls
          if (i==3) {
          }
          // level 5 controls
          if (i==4) {
          }
          // level 6 controls
          if (i==5) {
          }
        }
      }
    }

    // Admin controls
    const adminDiv=[
      document.getElementById('admin-controls1'),
      document.getElementById('admin-controls2'),
    ];
    for (let i=0; i<2; i++) {
      if (adminDiv[i]) {
        adminDiv[i].innerHTML='';
        const adminButton=document.createElement('a');
        adminButton.setAttribute('type', 'button');
        adminButton.setAttribute(
            'href',
            ``,
        );
        adminButton.setAttribute('class', 'btn btn-sm btn-danger');
        adminButton.innerText = 'Delete image';
        adminButton.onclick=(e)=>{
          e.preventDefault();
          if (confirm('Are you sure?')) {
            $.getJSON('/deletePic?id='+data.ids[i], (data)=>{
              location.reload();
            });
          }
        };
        adminDiv[i].appendChild(adminButton);
      }
    }
  }

  /**
   * Show images based on the /showImages response
   */
  function renderPage() {
    $.getJSON('/showImages', function(data) {
      if (data) {
        showControls(data);
        showImages(data);
        showTags(data);
      } else {
        console.log('Error fetching images from server');
      }
    });
  }

  // Make left panel tag buttons call
  // the /changeTagId endpoint without changing page
  $('.changetag').click((e) => {
    e.preventDefault();
    $.getJSON(e.target.href, () => {
      location.reload();
    });
  });

  // Load the middle column pics, tags and controls
  renderPage();
};
