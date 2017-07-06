System.register(['knockout', 'lodash', './utils'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var ko, _, utils;
    var $, signals, AppViewModel;
    return {
        setters:[
            function (ko_1) {
                ko = ko_1;
            },
            function (_1) {
                _ = _1;
            },
            function (utils_1) {
                utils = utils_1;
            }],
        execute: function() {
            AppViewModel = (function () {
                function AppViewModel() {
                    var _this = this;
                    this.interval = 3000;
                    this.plot_size = 30;
                    this.machine_name = ko.observable();
                    this.cpu_num = ko.observable();
                    this.cpu_percent = ko.observable();
                    this.total_mem = ko.observable();
                    this.available_mem = ko.observable();
                    this.percent_mem = ko.observable();
                    this.nproc = ko.observable();
                    this.time_val = ko.observable();
                    this.cpu_data = ko.observableArray().extend({ deferred: true });
                    this.mem_data = ko.observableArray().extend({ deferred: true });
                    this.sel_id = ko.observable();
                    this.procTableObj = ko.observable();
                    this.cpu_data_for_plot = ko.pureComputed(function () {
                        return _.zip(_.range(_this.cpu_data().length), _this.cpu_data());
                    });
                    this.mem_data_for_plot = ko.pureComputed(function () {
                        return _.zip(_.range(_this.mem_data().length), _this.mem_data());
                    });
                }
                AppViewModel.prototype.updateLabels = function () {
                    var _this = this;
                    $.getJSON('/platform_info', function (data) {
                        var d = data.data;
                        //noinspection JSValidateTypes
                        document.title = "Task Manager for " + d.machine_name;
                        _this.machine_name(d.machine_name);
                        _this.cpu_num(d.cpu_num);
                        _this.cpu_percent(d.cpu_percent + '%');
                        _this.total_mem(utils.Utils.fileSize(d.total_mem));
                        _this.available_mem(utils.Utils.fileSize(d.available_mem));
                        _this.percent_mem(d.percent_mem + '%');
                        _this.nproc($("#proc_list").find("tbody").find("tr").length);
                        utils.Utils.push_and_remove(_this.cpu_data, d.cpu_percent, _this.plot_size);
                        utils.Utils.push_and_remove(_this.mem_data, d.percent_mem, _this.plot_size);
                    });
                };
                ;
                AppViewModel.prototype.setupSlider = function () {
                    var init_val = this.interval / 1000;
                    $('#time_slider').slider({
                        value: init_val,
                        min: 1,
                        max: 60,
                        step: 1,
                        slide: function (event, ui) {
                            this.time_val(ui.value + 's');
                        },
                        change: function (event, ui) {
                            clearInterval(this.timer);
                            this.interval = ui.value * 1000;
                            this.setTimeouts();
                        }
                    });
                    this.time_val(init_val + 's');
                };
                ;
                AppViewModel.prototype.setTimeouts = function () {
                    var _this = this;
                    this.timer = setInterval(function () {
                        var table = _this.procTableObj();
                        table.ajax.reload();
                        table.draw();
                        _this.updateLabels();
                    }, this.interval);
                };
                ;
                AppViewModel.prototype.chooseSignal = function () {
                    var numS = prompt("Inserisci il codice relativo al segnale che vuoi inviare:", "15");
                    var num = parseInt(numS, 10);
                    if (isNaN(num)) {
                        alert("Numero inserito non valido!");
                        return null;
                    }
                    return { strnum: num, signum: num };
                };
                ;
                AppViewModel.prototype.setupMenu = function () {
                    var _this = this;
                    var menu_sign = {};
                    _.forOwn(signals, function (v, k) {
                        menu_sign[v] = { name: "Send " + k, sigName: k, sigNum: +v };
                    });
                    menu_sign["choose"] = { name: "Input signal number" };
                    $.contextMenu({
                        selector: '#proc_list tbody tr',
                        build: function ($trigger) {
                            if (!_this.sel_id())
                                return false;
                            $trigger = $('#' + _this.sel_id());
                            var name = $trigger.children().eq("0").text();
                            var pid = $trigger.children().eq("1").text();
                            return {
                                callback: function (key) {
                                    var res;
                                    if (key == "choose")
                                        res = this.chooseSignal();
                                    else {
                                        var opt = menu_sign[key];
                                        if (opt)
                                            res = {
                                                strnum: opt.sigName,
                                                signum: opt.sigNum
                                            };
                                    }
                                    if (res && confirm("Vuoi davvero inviare il segnale " + res.strnum + " al processo " + name + "?")) {
                                        $.post('/kill', {
                                            'pid': pid,
                                            'signum': res.signum
                                        }, function (data) {
                                            alert(data);
                                            this.sel_id(null);
                                        });
                                    }
                                },
                                items: menu_sign
                            };
                        }
                    });
                };
                ;
                AppViewModel.prototype.init = function () {
                    this.updateLabels();
                    this.setTimeouts();
                    this.setupSlider();
                    this.setupMenu();
                };
                ;
                return AppViewModel;
            }());
            $(function () {
                var vm = new AppViewModel();
                ko.applyBindings(vm);
                vm.init();
            });
            ko.bindingHandlers['plot'] = {
                init: function (element, valueAccessor, allBindings) {
                    var options = allBindings.get("plotOptions");
                    options = _.defaults({
                        ticks: 10,
                        min: 0,
                        max: 100
                    }, options);
                    var plot = $.plot(element, [
                        []
                    ], {
                        yaxis: { min: options.min, max: options.max, ticks: options.ticks },
                        xaxis: { show: false, min: 0, max: options.plot_size - 1 }
                    });
                    ko.utils.domData.set(element, "plot", plot);
                },
                update: function (element, valueAccessor) {
                    var plot = ko.utils.domData.get(element, "plot");
                    plot.setData([ko.unwrap(valueAccessor())]);
                    plot.draw();
                }
            };
            ko.bindingHandlers['procTable'] =
                {
                    init: function (element, valueAccessor) {
                        var value = ko.unwrap(valueAccessor());
                        var proc_table = $(element);
                        var table = proc_table.DataTable({
                            ajax: {
                                url: '/proc_info',
                                type: 'GET'
                            },
                            paging: false,
                            lengthChange: false,
                            columns: [
                                { className: 'dt-center' },
                                { className: 'dt-center' },
                                { className: 'dt-center' },
                                { className: 'dt-center' },
                                { className: 'dt-center' },
                                { className: 'dt-center' },
                                { className: 'dt-center' },
                                { className: 'dt-left' }
                            ],
                            order: [0, 'asc'],
                            fnRowCallback: function (nRow, aData) {
                                $(nRow).attr('id', 'proc_' + aData[1]);
                                return nRow;
                            },
                            scrollY: document.body.scrollHeight - 200,
                            columnDefs: [
                                {
                                    render: function (data, type) {
                                        return (type === 'display') ? utils.Utils.fileSize(data) : data;
                                    },
                                    targets: 4
                                }
                            ]
                        });
                        proc_table.addClass('display compact nowrap');
                        proc_table.find('tbody').on('click', 'tr', function () {
                            if ($(this).hasClass('selected')) {
                                $(this).removeClass('selected');
                                value.sel_id(null);
                            }
                            else {
                                table.$('tr.selected').removeClass('selected');
                                $(this).addClass('selected');
                                value.sel_id($(this).attr('id'));
                            }
                        });
                        proc_table.on('draw.dt', function () {
                            if (value.sel_id())
                                $('#' + value.sel_id()).addClass('selected');
                        });
                        ko.utils.domData.set(element, "table", table);
                        value.procTableObj(table);
                    }
                };
        }
    }
});
//# sourceMappingURL=app.js.map