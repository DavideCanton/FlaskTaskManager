function AppViewModel()
{
    var self = this;

    self.interval = 3000;
    self.plot_size = 30;

    self.machine_name = ko.observable();
    self.cpu_num = ko.observable();
    self.cpu_percent = ko.observable();
    self.total_mem = ko.observable();
    self.available_mem = ko.observable();
    self.percent_mem = ko.observable();
    self.nproc = ko.observable();
    self.time_val = ko.observable();
    self.cpu_data = ko.observableArray().extend({deferred: true});
    self.mem_data = ko.observableArray().extend({deferred: true});
    self.sel_id = ko.observable();
    self.procTableObj = ko.observable();

    self.updateLabels = function ()
    {
        $.getJSON('/platform_info', function (data)
        {
            var d = data.data;

            //noinspection JSValidateTypes
            document.title = "Task Manager for " + d.machine_name;
            self.machine_name(d.machine_name);
            self.cpu_num(d.cpu_num);
            self.cpu_percent(d.cpu_percent + '%');
            self.total_mem(Utils.fileSize(d.total_mem));
            self.available_mem(Utils.fileSize(d.available_mem));
            self.percent_mem(d.percent_mem + '%');
            self.nproc($("#proc_list").find("tbody").find("tr").length);

            Utils.push_and_remove(self.cpu_data, d.cpu_percent, self.plot_size);
            Utils.push_and_remove(self.mem_data, d.percent_mem, self.plot_size);
        })
    };

    self.cpu_data_for_plot = ko.pureComputed(function ()
    {
        return _.zip(_.range(self.cpu_data().length), self.cpu_data());
    });

    self.mem_data_for_plot = ko.pureComputed(function ()
    {
        return _.zip(_.range(self.mem_data().length), self.mem_data());
    });

    self.setupSlider = function ()
    {
        var init_val = self.interval / 1000;
        $('#time_slider').slider({
            value: init_val,
            min: 1,
            max: 60,
            step: 1,
            slide: function (event, ui)
            {
                self.time_val(ui.value + 's');
            },
            change: function (event, ui)
            {
                clearInterval(self.timer);
                self.interval = ui.value * 1000;
                self.setTimeouts();
            }
        });
        self.time_val(init_val + 's');
    };

    self.setTimeouts = function ()
    {
        self.timer = setInterval(function ()
            {
                var table = self.procTableObj();
                table.ajax.reload();
                table.draw();
                self.updateLabels();
            },
            self.interval);
    };

    self.chooseSignal = function ()
    {
        var num = prompt("Inserisci il codice relativo al segnale che vuoi inviare:", "15");
        num = +num;
        if (isNaN(num))
        {
            alert("Numero inserito non valido!");
            return null;
        }
        return {strnum: num, signum: num};
    };

    self.setupMenu = function ()
    {
        var menu_sign = {};
        _.forOwn(signals, function (v, k)
        {
            menu_sign[v] = {name: "Send " + k, sigName: k, sigNum: +v};
        });
        menu_sign["choose"] = {name: "Input signal number"};

        $.contextMenu({
            selector: '#proc_list tbody tr',
            build: function ($trigger)
            {
                if (!self.sel_id())
                    return false;
                $trigger = $('#' + self.sel_id());
                var name = $trigger.children().eq("0").text();
                var pid = $trigger.children().eq("1").text();
                return {
                    callback: function (key)
                    {
                        var res;
                        if (key == "choose")
                            res = chooseSignal();
                        else
                        {
                            var opt = menu_sign[key];
                            if (opt)
                                res = {
                                    strnum: opt.sigName,
                                    signum: opt.sigNum
                                };
                        }

                        if (res && confirm("Vuoi davvero inviare il segnale " + res.strnum + " al processo " + name + "?"))
                        {
                            $.post('/kill', {
                                'pid': pid,
                                'signum': res.signum
                            }, function (data)
                            {
                                alert(data);
                                self.sel_id(null);
                            });
                        }
                    },
                    items: menu_sign
                }
            }
        });
    };

    self.init = function ()
    {
        self.updateLabels();
        self.setTimeouts();
        self.setupSlider();
        self.setupMenu();
    };
}

$(function ()
{
    var vm = new AppViewModel();
    ko.applyBindings(vm);
    vm.init();
});


ko.bindingHandlers.plot = {
    init: function (element, valueAccessor, allBindings)
    {
        var options = allBindings.get("plotOptions");
        options = _.defaults({
            ticks: 10,
            min: 0,
            max: 100
        }, options);

        var plot = $.plot(element, [
            []
        ], {
            yaxis: {min: options.min, max: options.max, ticks: options.ticks},
            xaxis: {show: false, min: 0, max: options.plot_size - 1}
        });

        ko.utils.domData.set(element, "plot", plot);
    },

    update: function (element, valueAccessor)
    {
        var plot = ko.utils.domData.get(element, "plot");
        plot.setData([ko.unwrap(valueAccessor())]);
        plot.draw();
    }
};

ko.bindingHandlers.procTable =
{
    init: function (element, valueAccessor)
    {
        var value = ko.unwrap(valueAccessor());
        var proc_table = $(element);
        var table = proc_table.DataTable(
            {
                ajax: {
                    url: '/proc_info',
                    type: 'GET'
                },
                paging: false,
                lengthChange: false,
                columns: [
                    {className: 'dt-center'},
                    {className: 'dt-center'},
                    {className: 'dt-center'},
                    {className: 'dt-center'},
                    {className: 'dt-center'},
                    {className: 'dt-center'},
                    {className: 'dt-center'},
                    {className: 'dt-left'}
                ],
                order: [0, 'asc'],
                fnRowCallback: function (nRow, aData)
                {
                    $(nRow).attr('id', 'proc_' + aData[1]);
                    return nRow;
                },
                columnDefs: [
                    {
                        render: function (data, type)
                        {
                            return (type === 'display') ? Utils.fileSize(data) : data;
                        },
                        targets: 4
                    }
                ]
            });
        proc_table.addClass('display compact nowrap');

        proc_table.find('tbody').on('click', 'tr', function ()
        {
            if ($(this).hasClass('selected'))
            {
                $(this).removeClass('selected');
                value.sel_id(null);
            }
            else
            {
                table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                value.sel_id($(this).attr('id'));
            }
        });

        proc_table.on('draw.dt', function ()
        {
            if (value.sel_id())
                $('#' + value.sel_id()).addClass('selected');
        });

        ko.utils.domData.set(element, "table", table);
        value.procTableObj(table);
    }
};