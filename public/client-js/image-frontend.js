$(document).ready(function() {
  $('#reprot').on('submit', function(event) {
    event.preventDefault();
    const formValues = $(this).serialize();
    $.post('/report', formValues, function(data) {
      // Display the returned data in browser
      console.log('data received' + JSON.stringify(data));
      $('#result').html(data.message);
    }, 'json');
  });
});

onload = function() {
  // Get pic id
  const picid = $('#picid').text();
  $('#picid').html('');

  // Get reports list (also checks if user is admin)
  $.getJSON('/API/getReportsAndEdits?picid=' + picid, (data) => {
    if (!data.err) {// if user is not admin, err will be true
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
      // Render reports
      for (let i = 0; i < data.reports.length; i++) {
        const reprot = document.createElement('li');
        // eslint-disable-next-line max-len
        reprot.innerText = data.reports[i].rtype + ': ' + data.reports[i].details;
        document.getElementById('reports').appendChild(reprot);
      }
      // Render edits
      for (let i = 0; i < data.edits.length; i++) {
        const edit = document.createElement('li');
        console.log(JSON.stringify(data.edits[i]));

        const dd=Math.floor(
            (new Date() - new Date(data.edits[i].date)
            ) / (1000*60*60*24),
        );
        // eslint-disable-next-line max-len
        edit.innerText = `${data.edits[i].uname}: ${data.edits[i].edit_type}: "${data.edits[i].previous_data}" (${dd}) days ago.`;
        document.getElementById('edits').appendChild(edit);
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
        // load image
        const parsedSrc=data.fn.split('.');
        if (parsedSrc[parsedSrc.length - 1] === 'webm') {
          // if webm do this
          document.getElementById('pic').style.display = 'none';
          document.getElementById('pic').src = '';
          document.getElementById('src').src = data.fn;
          document.getElementById('vid').load();
          clickable = document.getElementById('vid');
          $(clickable).show();
        } else {
          document.getElementById('pic').src = data.fn;
          clickable = document.getElementById('pic');
          clickable.alt = data.description;
          $(clickable).hide();
          clickable.onload = (() => {
            $(clickable).fadeIn(500);
          });
        }

        // Show tag buttons
        $('#loading-tags').html('');
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

        // Handle clicking on red tags (remove)
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

        // Handle clicking on green tags (add)
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

      // Show image description
      $('#img-desc').text(data.description);

      // Show description input
      $('#edit-desc').click((e)=>{
        e.preventDefault();
        $('#img-desc').html(
            `<form class="form-inline" id='change-desc-form'>
           <input id='new-desc' type="text" name="new-desc" 
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
                  alert(data.message);
                  console.log('error changing desciption: '+data.message);
                } else {
                  console.log(data.message);
                  refreshData(picid);
                }
              });
        });
      });

      // Show image score
      $('#img-score').html(
          `${(parseFloat(data.votes)/parseFloat(data.views)).toFixed(2)}(${data.votes}/${data.views})`,
      );
    });
  };
  refreshData(picid);
};
