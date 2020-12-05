onload = function() {
  $.getJSON('/API/getBlogData', function(data) {
    if (data) {
      const container = document.getElementById('blog-titles');
      const rightpanel = document.getElementById('right-bar');
      for (let post = 0; post < data.data.length; post++) {
        // eslint-disable-next-line max-len
        const bpl = `blogpost/${data.data[post].id}/${data.data[post].title.replaceAll(' ', '-')}`;

        const card = document.createElement('div');
        card.setAttribute('style', 'background-color:#eeeef8;');
        card.innerHTML=`<a href=${bpl}' style='color:#000;'
        ><h3>${data.data[post].title}</h3></a><br>`;

        const body = document.createElement('div');
        const date = new Date(data.data[post].date);
        body.innerHTML = `<a href=${bpl}' style='color:#000;'
        ><p>${data.data[post].abstract}</p></a>
        <p><small class="text-muted">
        Posted on ${date.toLocaleDateString()}
        <a href='modblogpost/${data.data[post].id}'>edit</a> 
        <a href='delblogpost/${data.data[post].id}'>delete</a> </small></p>`;

        card.appendChild(body);
        container.appendChild(card);
      }

      const rcontrols = document.createElement('div');
      const newPostLink = document.createElement('a');
      newPostLink.href = `modblogpost/99999999`;
      newPostLink.innerHTML = 'Create post';
      rcontrols.appendChild(newPostLink);
      rightpanel.appendChild(rcontrols);
    } else {
      console.log('Error fetching images from server');
    }
  });
};
