onload = function () {
  /**
   * Hides the images so people cant click them, and shows scores
   *
   * @param {data} data - JSON returned from api
   * @param {int} votedindex - index of voted pic
   */
  function showImgInfoWhileLoading(data, votedindex) {
    for (let i = 0; i < 2; i++) {
      const img = document.getElementById('img' + i);
      const vid = document.getElementById('vid' + i);
      const txt = document.getElementById('txt' + i);
      $(txt).show();
      let score = '<br><br><br><br>';
      if (i == votedindex) {
        score += 'Voted! <br>';
      } else {
        score += '<br>';
      }
      if (data.views[i] > 5) {
        score += 'Score:' + (data.votes[i] / data.views[i]).toFixed(2);
      } else {
        score += 'Not enough votes for meaningful score';
      }
      $(txt).html(
        `${score}`,
        // <br>
        // <div class='scorebar'
        // style='min-width:${(data.votes[i] / data.views[i]) * 100}%'>
        // &nbsp;</div>`,
      );
      console.log($(txt).html());
      img.onload = function () { };
      vid.onload = function () { };
      img.onclick = () => { };
      vid.onclick = () => { };
    }
    location.reload();
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
   * refreshes the index page leaderbopard.
   * @param {object} data - server response from calling /API/getTwoRandomPics
   */
  function updateLeaderboard(data) {
    $.getJSON(
      '/API/getLeaderboards?n=10&tag=' + data.tags[0][0],
      (top10) => {
        $('#tag-leaderboard').html(`<ul id='tleaders'></ul>`);
        if (!top10.err) {
          for (let i = 0; i < top10.top.length; i++) {
            $('#tleaders').append(
              // eslint-disable-next-line max-len
              `<li><a href="/image?picid=${top10.top[i].id}">${top10.top[i].description}</a> (${top10.top[i].votes}/${top10.top[i].views} - ${top10.top[i].score})</li>`,
            );
          }
        }
      });
    $.getJSON(
      '/API/getLeaderboards?n=10',
      (top10) => {
        $('#global-leaderboard').html(`<ul id='gleaders'></ul>`);
        if (!top10.err) {
          for (let i = 0; i < top10.top.length; i++) {
            $('#gleaders').append(
              // eslint-disable-next-line max-len
              `<li><a href="/image?picid=${top10.top[i].id}">${top10.top[i].description} </a> (${top10.top[i].votes}/${top10.top[i].views} - ${top10.top[i].score})</li>`,
            );
          }
        }
      });
  }

  /**
   * Loads the tags under the images.
   *
   * @param {object} data - server response from calling /API/getTwoRandomPics
   */
  function showTags(data) {
    // Tag divs
    const pt = [
      document.getElementById('tags1'),
      document.getElementById('tags2'),
    ];

    // Set tags
    for (let j = 0; j < 2; j++) {
      // clear tags
      pt[j].innerHTML = '';
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
   * @param {object} data - server response from calling /API/getTwoRandomPics
   */
  function showImages(data) {
    for (let i = 0; i < 2; i++) {
      let clickable;
      const loadingText = document.getElementById('txt' + i);
      const parsedSrc = data.images[i].split('.');

      if (parsedSrc[parsedSrc.length - 1] === 'webm') {
        // if webm do this
        document.getElementById('img' + i).style.display = 'none';
        document.getElementById('img' + i).src = '';
        document.getElementById('src' + i).src = data.images[i];
        document.getElementById('vid' + i).load();
        clickable = document.getElementById('vid' + i);
        $(loadingText).hide();
        $(clickable).show();
      } else {
        document.getElementById('img' + i).src = data.images[i];
        document.getElementById('vid' + i).pause();
        document.getElementById('src' + i).src = '';
        document.getElementById('src' + i).removeAttribute('src');
        document.getElementById('vid' + i).removeAttribute('src');
        document.getElementById('vid' + i).load();

        clickable = document.getElementById('img' + i);
        clickable.alt = data.desc[i];
        $(clickable).hide();
        $(loadingText).show();
        clickable.onload = (() => {
          $(clickable).fadeIn(500);
          $(loadingText).hide();
        });
      }
      $(clickable).removeClass('selected'); // Change the pic appearance
      clickable.onclick = () => {
        $(clickable).addClass('selected'); // Change the pic appearance
        vote(data.ids[i % 2], data.ids[(i + 1) % 2], i % 2);
      };
    }

    let voted = false;
    /**
     * calls the /API/vote endpoint
     * @param {int} voteid - image id to vote for
     * @param {int} otherid - the other image to increase its views
     * @param {int} index - the index of the pic in this file (i)
     */
    function vote(voteid, otherid, index) {
      if (!voted) {// prevent voting for both
        showImgInfoWhileLoading(data, index);
        updatePointsDisplay();
        $.getJSON(
          `/API/vote?voteid=${voteid}&otherid=${otherid}`,
          () => {
            renderPage();
          },
        );
      }
      voted = true;
    }
  }

  /**
   * Shows buttons for reporting, changing, tagging, renaming, deleting etc
   * @param {object} data - the data from renderPage
   */
  function showControls(data, i) {
    // Level 3: change tags buttons
    const c = [];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 2; j++) {
        c[i] = [];
        c[i][j] = document.getElementById(`level${i + 1}-controls${j + 1}`);
        if (c[i][j]) {
          c[i][j].innerHTML = '';
          const controlButton = document.createElement('a');
          controlButton.setAttribute('type', 'button');
          // level 1 controls
          if (i == 0) {
          }
          // level 2 controls
          if (i == 1) {
          }
          // level 3 controls
          if (i == 2) {
          }
          // level 4 controls
          if (i == 3) {
          }
          // level 5 controls
          if (i == 4) {
          }
          // level 6 controls
          if (i == 5) {
          }
        }
      }
    }

    // Admin controls
    const adminDiv = [
      document.getElementById('admin-controls1'),
      document.getElementById('admin-controls2'),
    ];
    // no ptiviledges required for these
    const noPrivDiv = [
      document.getElementById('no-priviledge-controls1'),
      document.getElementById('no-priviledge-controls2'),
    ];
    for (let i = 0; i < 2; i++) {
      if (adminDiv[i]) {
        adminDiv[i].innerHTML = '';
        const adminButton = document.createElement('a');
        adminButton.setAttribute('type', 'button');
        adminButton.setAttribute(
          'href',
          ``,
        );
        adminButton.setAttribute('class', 'btn btn-sm btn-danger');
        adminButton.innerText = 'Delete image';
        adminButton.onclick = (e) => {
          e.preventDefault();
          if (confirm('Are you sure?')) {
            $.getJSON(`/API/deletePic?picid=${data.ids[i]}`, (data) => {
              location.reload();
            });
          }
        };
        adminDiv[i].appendChild(adminButton);
      }
      noPrivDiv[i].innerHTML = '';
      const btn = document.createElement('a');
      btn.setAttribute('type', 'button');
      btn.setAttribute(
        'href',
        `/image?picid=${data.ids[i]}`,
      );
      btn.setAttribute('class', 'btn btn-sm btn-primary');
      btn.innerText = 'View image';
      noPrivDiv[i].appendChild(btn);
    }
  }


  /**
  * Show images based on the /API/getTwoRandomPics response
  */
  function renderPage() {

    $.getJSON('/API/getTwoRandomPics', function (data) {
      if (data) {
        if (data.reload) {
          location.reload();
        }
        showControls(data);
        showImages(data);
        showTags(data);
        if (!document.getElementById('gleaders')) {
          console.log('updating leaderboard');
          updateLeaderboard(data);
        }
      } else {
        console.log('Error fetching images from server');
      }
    });
  }

  // Make left panel tag buttons call
  // the /API/changeTagId endpoint without changing page
  $('.changetag').click((e) => {
    e.preventDefault();
    $.getJSON(e.target.href, () => {
      location.reload();
    });
  });

  // Load the middle column pics, tags and controls
  renderPage();
};
