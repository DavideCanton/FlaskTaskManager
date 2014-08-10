var timer, timer2, table;
var interval = 3000;
var sel_id = null;

var plot_size = 30;
var cpu_data = [];
var cpu_plot = null;
var mem_data = [];
var mem_plot = null;

function fileSize(a, b, c, d, e)
{
    return (b = Math, c = b.log, d = 1024, e = c(a) / c(d) | 0, a / b.pow(d, e)).toFixed(2)
        + ' ' + (e ? 'KMGTPEZY'[--e] + 'iB' : 'Bytes')
}

$(document).ready(function ()
{
    setupTable();
    setTableHandlers();
    updateLabels();
    setTimeouts();
    setupSlider();
    setupMenu();
    setupPlots();
});

function setupPlots()
{
    var container = $("#cpu_chart");
    cpu_plot = $.plot(container, [
        []
    ], {
        yaxis: { min: 0, max: 100, ticks: 10 },
        xaxis: { show: false, min: 0, max: plot_size - 1 }
    });

    container = $("#mem_chart");
    mem_plot = $.plot(container, [
        []
    ], {
        yaxis: { min: 0, max: 100, ticks: 10 },
        xaxis: { show: false, min: 0, max: plot_size - 1 }
    });
}


function setupMenu()
{
    var menu_sign = {};
    for (var k in signals)
    {
        var s = k.toLowerCase() + "_" + signals[k];
        menu_sign[s] = {name: "Send " + k};
    }
    menu_sign["choose"] = {name: "Input signal number"};

    $.contextMenu({
        selector: '#proc_list tbody tr',
        build: function ($trigger, e)
        {
            if (!sel_id)
                return false;
            $trigger = $('#' + sel_id);
            var name = $trigger.children().eq("0").text();
            var pid = $trigger.children().eq("1").text();
            return {
                callback: function (key, options)
                {
                    var strnum = null;
                    var signum = null;
                    if (key == "choose")
                    {
                        var num = prompt("Inserisci il codice relativo al segnale che vuoi inviare:", "15");
                        num = +num;
                        if (isNaN(num))
                        {
                            alert("Numero inserito non valido!");
                            return;
                        }
                        strnum = num;
                        signum = num;
                    }
                    else
                    {
                        var regex = new RegExp("sig(\\w+)_(\\d+)");
                        // splitted[1] is the name, splitted[2] the number
                        var splitted = regex.exec(key);
                        strnum = "SIG" + splitted[1].toUpperCase();
                        signum = splitted[2];
                    }

                    var answer = confirm("Vuoi davvero inviare il segnale " + strnum + " al processo " + name + "?");
                    if (answer)
                    {
                        $.post('/kill', {'pid': pid, 'signum': signum}, function (data)
                        {
                            alert(data);
                            sel_id = null;
                        });
                    }
                },
                items: menu_sign
            }
        }
    });
}

function setTimeouts()
{
    timer = setInterval(function ()
        {
            table.ajax.reload();
            table.draw();
        },
        interval);
    timer2 = setInterval(function ()
    {
        updateLabels()
    }, interval);
}

function setTableHandlers()
{
    var proc_table = $('#proc_list');
    proc_table.find('tbody').on('click', 'tr', function ()
    {
        if ($(this).hasClass('selected'))
        {
            $(this).removeClass('selected');
            sel_id = null;
        }
        else
        {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            sel_id = $(this).attr('id');
        }
    });

    proc_table.on('draw.dt', function ()
    {
        if (sel_id)
            $('#' + sel_id).addClass('selected');
    })
}

function push_and_remove(array, data)
{
    array.push([plot_size + 1, data]);
    if (array.length > plot_size)
        array.shift();
    for (var i = 0; i < plot_size; i++)
        if (array[i])
            array[i] = [i, array[i][1]];
}

function updateLabels()
{
    $.getJSON('/platform_info', function (data)
    {
        var d = data.data;
        document.title = "Task Manager for " + d.machine_name;
        $('#machine_name').html(d.machine_name);
        $('#cpu_num').html(d.cpu_num);
        $('#cpu_percent').html(d.cpu_percent + '%');
        $('#total_mem').html(fileSize(d.total_mem));
        $('#available_mem').html(fileSize(d.available_mem));
        $('#percent_mem').html(d.percent_mem + '%');
        $('#nproc').html(table.column(0).data().length);

        push_and_remove(cpu_data, d.cpu_percent);
        cpu_plot.setData([cpu_data]);
        cpu_plot.draw();

        push_and_remove(mem_data, d.percent_mem);
        mem_plot.setData([mem_data]);
        mem_plot.draw();
    })
}

function setupTable()
{
    var proc_table = $('#proc_list');
    table = proc_table.DataTable(
        {
            'ajax': {
                'url': '/proc_info',
                'type': 'GET'
            },
            'paging': false,
            'lengthChange': false,
            'columns': [
                { 'className': 'dt-center' },
                { 'className': 'dt-center' },
                { 'className': 'dt-center' },
                { 'className': 'dt-center' },
                { 'className': 'dt-center' },
                { 'className': 'dt-center' },
                { 'className': 'dt-center' },
                { 'className': 'dt-left' }
            ],
            'order': [ 0, 'asc' ],
            'fnRowCallback': function (nRow, aData, iDisplayIndex, iDisplayIndexFull)
            {
                $(nRow).attr('id', 'proc_' + aData[1]);
                return nRow;
            },
            'columnDefs': [
                {
                    'render': function (data, type, row, meta)
                    {
                        return (type === 'display') ? fileSize(data) : data;
                    },
                    'targets': 4
                }
            ]
        });
    proc_table.addClass('display').addClass('compact').addClass('nowrap');
}

function setupSlider()
{
    var init_val = interval / 1000;
    $('#time_slider').slider({
        value: init_val,
        min: 1,
        max: 60,
        step: 1,
        slide: function (event, ui)
        {
            $('#time_val').text(ui.value + 's');
        },
        change: function (event, ui)
        {
            clearInterval(timer);
            clearInterval(timer2);
            interval = ui.value * 1000;
            setTimeouts();
        }
    });
    $('#time_val').text(init_val + 's');
}