onload = function() {
  $('.removeallreports').click((e) => {
    e.preventDefault();
    $.getJSON(e.target.href, () => {
      location.assign('/showreports');
    });
  });
  $('.confirm-button').click((e)=>{
    e.preventDefault();
    if (confirm('Are you sure?')) {
      $.getJSON(e.target.href, (data)=>{
        $.getJSON($('#remove-all-reports').attr('href'), ()=>{
          location.assign('/');
        });
      });
    }
  });


  const picid = $('#picid').text();
  $('#picid').html('');


  $.getJSON('/API/getReports?picid=' + picid, (data) => {
    if (!data.err) {
      for (let i = 0; i < data.length; i++) {
        const reprot = document.createElement('li');
        reprot.innerText = data[i].rtype + ': ' + data[i].details;
        document.getElementById('reports').appendChild(reprot);
      }
    }
    $('#loading').text('');
  });

  refreshData=function(picid) {
    $('#loading-tags').html('Loading tags...');
    $('#remove-tag-list').html('');
    $('#add-tag-list').html('');
    $.getJSON('/API/getPicData?picid=' + picid, (data) => {
      if (!data.err) {
        $('#loading-tags').html('');
        if (!$('#pic').attr('src')) {
          $('#pic').attr('src', data.fn);
        }

        for (let i = 0; i < data.tags.length; i++) {
          $('#remove-tag-list').append(
              // eslint-disable-next-line max-len
              `<a href="/API/removeTag?picid=${picid}&tag=${data.tags[i]}" class="removetag btn btn-sm btn-danger">${data.tags[i]}</a>`,
          );
        }

        for (let i = 0; i < data.alltags.length; i++) {
          if (data.tags.indexOf(data.alltags[i].tag) <= -1) {
            $('#add-tag-list').append(
                // eslint-disable-next-line max-len
                `<a href="/API/addTag?picid=${picid}&tag=${data.alltags[i].tag}" class="addtag btn btn-sm btn-success">${data.alltags[i].tag}</a>`,
            );
          }
        }

        $('.removetag').click((e) => {
          e.preventDefault();
          $.getJSON(e.target.href, (data) => {
            if (data.err) {
              alert('error while changing tag: '+data.message);
            }
            console.log(data.message);
            refreshData(picid);
          });
        });

        $('.addtag').click((e) => {
          e.preventDefault();
          $.getJSON(e.target.href, (data) => {
            if (data.err) {
              alert('error while changing tag: '+data.message);
            }
            console.log(data.message);
            refreshData(picid);
          });
        });
      } else {
        console.log('error getting pic data: '+data.message);
      }
      $('#desc').text(data.description);
      $('#edit-desc').click((e)=>{
        e.preventDefault();
        $('#desc').html(
            `<form class="form-inline" id='change-desc-form'>
           <input id='new-desc' type="text" name="desc" 
           value='${data.description}'>
           <input type="submit" value="Change">
           </form>`,
        );
        $('#change-desc-form').submit((e)=>{
          e.preventDefault();
          const newDesc=$('#new-desc').val();
          $.getJSON(
              `/API/changeDescription?picid=${picid}&newdesc=${newDesc}`,
              (data)=>{
                if (data.err) {
                  console.log('error changing desciption: '+data.message);
                } else {
                  console.log(data.message);
                  refreshData(picid);
                }
              });
        });
      });
    });
  };
  refreshData(picid);
};
