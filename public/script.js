$(document).ready(function() {
    if ($('div').hasClass('home')) {
        $('li.home').addClass('selected');
    }

    else if ($('div').hasClass('newpoll')) {
        $('li.newpoll').addClass('selected');
    }

    else if ($('div').hasClass('mypolls')) {
        $('li.mypolls').addClass('selected');
    }

    if ($('div').hasClass('graph')) {
        var keys;
        var values;
        /*
        // Our labels along the x-axis
        
        */
        var path = (window.location.pathname).slice(6, (window.location.pathname).length);

        $.get('/ajax/' + path, function(data, status) {
            keys = data.keys;
            values = data.values;
            title = data.title;
            var dataColors = [];
            var dataOutline = [];
            var outlines = ['RGBA(209, 0, 0, 0.8)', 'RGBA(255, 102, 34, .8)', 'RGBA(255, 218, 33, .8)', 'RGBA(51, 221, 0, .8)', 'RGBA(17, 51, 204, .8)', 'RGBA(75, 0, 130, .8)', 'RGBA(51, 0, 68, .8)']; 
            var colors = ['RGBA(209, 0, 0, 0.2)', 'RGBA(255, 102, 34, .2)', 'RGBA(255, 218, 33, .2)', 'RGBA(51, 221, 0, .2)', 'RGBA(17, 51, 204, .2)', 'RGBA(75, 0, 130, .2)', 'RGBA(51, 0, 68, .2)'];
            for (var i = 0; i < keys.length; i++) {
                var color = i < 7 ? colors[i] : colors[ i % 7];
                var outline = i < 7 ? outlines[i] : outlines[ i % 7];
                dataColors.push(color);
                dataOutline.push(outline);   
            }

            var ctx = document.getElementById("myChart");
            var myChart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: keys,
                datasets: [
                  { 
                    data: values,
                    label: title,
                    borderColor: dataOutline,
                    backgroundColor: dataColors,
                    borderWidth: 5,
                    fill: true
                  }
                ]
              },

              options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },

                        scaleLabel: {
                            display: true,
                            labelString: '# of Votes'
                        }
                    }],

                    xAxes: [{

                        scaleLabel: {
                            display: true,
                            labelString: 'Poll Options'
                        }
                    }]
                },
              }

            });

            $.each(keys, function(i) {
                var aaa = $('<option/>').text(keys[i]).attr('value',keys[i]).appendTo($('select.custom-select'));
            });
            //if user created poll display the delete button
            if (data.createdBy == true) {
                $('button.btn-center').removeClass('hidden');
            }
        });
    }

    function showAlert(error) {
        if(error.responseText == 'showAlert') {
            alert("Please enter correct user name and password.");
        }
    }
});