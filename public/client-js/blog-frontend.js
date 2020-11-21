onload = function() {
  $.getJSON('/API/getBlogData', function(data) {
    if (data) {
      const container = document.getElementById('blog-titles');
      for (let post = 0; post < data.data.length; post++) {
        const a = document.createElement('a');
        // eslint-disable-next-line max-len
        a.href = `blogpost/${data.data[post].id}/${data.data[post].title.replaceAll(' ', '-')}`;

        const card = document.createElement('div');
        card.setAttribute('class', 'panel mb-3');
        card.setAttribute('style', 'max-width: 100%;');

        const row = document.createElement('div');
        row.setAttribute('class', 'row no-gutters');

        const imgCol = document.createElement('div');
        imgCol.setAttribute('class', 'col-md-4');

        const img = document.createElement('img');
        if (data.data[post].filename) {
          img.src = data.prefix + data.data[post].filename;
        }
        img.alt = data.data[post].title;
        img.setAttribute('style', 'width:100%;');

        const bodyCol = document.createElement('div');
        bodyCol.setAttribute('class', 'col-md-8');

        const body = document.createElement('div');
        body.setAttribute('class', 'panel-body');
        const date = new Date(data.data[post].date);
        body.innerHTML = `<h3>${data.data[post].title}</h3>
        <p class="panel-text">${data.data[post].abstract}</p>
        <p class="panel-text"><small class="text-muted">
        Posted on ${date.toLocaleDateString()}
        </small></p>`;
        bodyCol.appendChild(body);
        imgCol.appendChild(img);
        row.appendChild(imgCol);
        row.appendChild(bodyCol);
        card.appendChild(row);
        a.appendChild(bodyCol);
        container.appendChild(a);

        const controls = document.createElement('div');
        controls.setAttribute('class', 'row');
        const editlink = document.createElement('a');
        editlink.href = `modblogpost/${data.data[post].id}`;
        editlink.innerHTML = 'edit';
        controls.appendChild(editlink);
        container.appendChild(controls);
      }

      const controls = document.createElement('div');
      controls.setAttribute('class', 'row');
      const editlink = document.createElement('a');
      editlink.href = `modblogpost/99999999`;
      editlink.innerHTML = 'Create post';
      controls.appendChild(editlink);
      container.appendChild(controls);
    } else {
      console.log('Error fetching images from server');
    }
  });
};
