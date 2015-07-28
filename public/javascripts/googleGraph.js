var updatedData;
var columnFactor = 6;

function drawVisualization() {
    // Some raw data (not necessarily accurate)
    var data = google.visualization.arrayToDataTable([
        ['Month', {label:'Bolivia',colType:'bars'}, {label:'Ecuador',colType:"bars"}, {label:'Madagascar',colType:"bars"}, {label:'Papua New Guinea',colType:"bars"}, {label:'Rwanda',colType:"line"}, {label:'Average',colType:"line"}, {
            id: 'Question',
            role: 'annotation'
        }, {
            id: 'Answer',
            role: 'annotationText',
            p: {
                html: true
            }
        }],
        ['2004/05', 165, 938, 522, 998, 450, 2500, '', ''],
        ['2005/06', 135, 1120, 599, 1268, 288, 1800, '', ''],
        ['2006/07', 157, 1167, 587, 807, 397, 1000, '', ''],
        ['2007/08', 139, 1110, 615, 968, 215, 600, '', ''],
        ['2008/09', 136, 691, 629, 1026, 366, 100, '', '']
    ]);


    var options = {
        pointSize: 5,
        isStacked: true,
        annotation: {
            allowHtml: true
        },
        tooltip: {
            isHtml: true
        },
        title: 'Monthly Coffee Production by Country',
        vAxis: {
            title: "Cups"
        },
        hAxis: {
            title: "Month"
        },
        seriesType: "bars",
        series: {
            4: {
                type: "line"
            },
            5: {
                type: "line"
            }
        }
    };

    var chart = new google.visualization.ComboChart(document.getElementById('chart_div'));
    chart.draw(data, options);
    updatedData = data;

    for (var i = 1; i < data.getNumberOfColumns(); i++) {
        if (data.getColumnLabel(i) != '') {
            $("#series").append("<li><input type='checkbox' name='series' value='" + i + "' checked='true' /> " + data.getColumnLabel(i) + "</li>");
        }
    }

    function selectHandler() {
        try {
            var selectedItem = chart.getSelection()[0];
            var row = selectedItem.row;
            var column = selectedItem.column;
            if (selectedItem && selectedItem.column > 4) {
                if (data.getValue(row, column) == "A"){
                    return;
                }
                 else if (data.getValue(row, column) == "Q") {
                    var answer = prompt("Enter your Answer");
                    data.setValue(row, column, 'A');
                    data.setValue(row, column + 1, data.getValue(row, column + 1) + "<br\>Answer: " + answer);
                }
                else if (data.getValue(row, column+1) == "Q") {
                    var answer = prompt("Enter your Answer");
                    data.setValue(row, column+1, 'A');
                    data.setValue(row, column + 2, data.getValue(row, column + 2) + "<br\>Answer: " + answer);
                }
                else if (data.getValue(row, column) != "Q") {
                    var question = prompt("Enter your question");
                    if(question!=null)
                    {
                        data.setValue(row, column + 1, 'Q');
                    data.setValue(row, column + 2, data.getValue(row, column + 2) + "<br\>Question: " + question);
                    }                    
                }
                chart.draw(data, options);
                updatedData = data;
            }
        } catch (e) {

        }
    }
    google.visualization.events.addListener(chart, 'select', selectHandler);

    jQuery(function ($) {

        $("#btnGetJson").on("click", function (e) {
            alert(updatedData.toJSON());
        });
        $("#comboFactor").on("change", function (e) {
            var factor = parseInt($(this).val());
            updatedData = data.clone();
            var rowCount = data.getNumberOfRows();
            var i;
            for (i = 0; i < rowCount; i++) {
                var val = data.getValue(i, columnFactor);
                val = val + (val * factor / 100);
                updatedData.setValue(i, columnFactor, val);
            }
            chart.draw(updatedData, options);
        });

        $('#series').find(':checkbox').change(function () {
            var cols = [0];
            view = new google.visualization.DataView(updatedData);
            options.series={};
            $('#series').find(':checkbox:checked').each(function (index,element) {
                var colVal = parseInt($(this).attr('value'));
                cols.push(colVal);
                if(updatedData.getColumnLabel(colVal)=="Average" || data.getColumnLabel(colVal)=="Rwanda"){
                    options.series[index]={type:"line"};
                }
                if(updatedData.getColumnLabel(colVal)=="Average"){
                    columnFactor=index;
                }
            });
            view.setColumns(cols);
            chart.draw(view, options);
        });

    });
}