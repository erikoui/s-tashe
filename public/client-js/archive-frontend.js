onload = function() {
  /**
   * show best image of each tag
   * @param {object} data - server response from calling /API/getBestEachTag
   */
  function showImages(data) {
    console.log(data);
    const gallery=document.getElementById('gallery');
    for (let i = 0; i < data.images.length; i++) {
      let clickable;
      const parsedSrc = data.images[i].src.split('.');

      let column;
      if (i<4) {
        column=document.createElement('div');
        column.setAttribute('class', 'gallery-column');
        column.id='col-'+i;
        gallery.appendChild(column);
      } else {
        column=document.getElementById('col-'+i%4);
      }

      const mediaContainer=document.createElement('div');
      mediaContainer.setAttribute('class', 'gallery-container');

      const tagBlock=document.createElement('div');
      tagBlock.setAttribute('class', 'gallery-text-block');
      tagBlock.innerHTML='<h4>'+data.images[i].tag+'</h4>';

      if (parsedSrc[parsedSrc.length - 1] === 'webm') {
        // if webm do this
        const vid=document.createElement('video');
        const src = document.createElement('source');
        src.setAttribute('type', 'video/webm');
        src.src=data.images[i].src;
        vid.appendChild(src);
        vid.load();
        clickable=vid;
        column.appendChild(vid);
      } else {
        const img=document.createElement('img');
        img.src = data.images[i].src;
        clickable = img;
        clickable.onload = (() => {
          $(clickable).fadeIn(500);
        });

        mediaContainer.appendChild(img);
        mediaContainer.appendChild(tagBlock);
        column.appendChild(mediaContainer);
      }
      clickable.onclick = () => {
        window.location.href='/tag?tag='+data.images[i].tag+'&page=1&ipp=121';
      };
    }
  }

  /**
 * Show images based on the /API/getBestEachTag response
 */
  function renderPage() {
    $.getJSON('/API/getBestEachTag', function(data) {
      if (data) {
        showImages(data);
      } else {
        console.log('Error fetching images from server');
      }
    });
  }

  // Load the middle column pics, tags and controls
  renderPage();
};
