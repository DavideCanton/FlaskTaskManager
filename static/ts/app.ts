import * as ko from 'knockout';
import _ from 'lodash';
import $ from 'jquery';
import * as interfaces from './interfaces';
import * as utils from './utils';

let signals: any;

export class AppViewModel
{
    interval = 3000;
    plot_size = 30;

    machine_name = ko.observable<string>();
    cpu_num = ko.observable<number>();
    cpu_percent = ko.observable<string>();
    total_mem = ko.observable<string>();
    available_mem = ko.observable<string>();
    percent_mem = ko.observable<string>();
    nproc = ko.observable<number>();
    time_val = ko.observable<string>();
    cpu_data = ko.observableArray<number>().extend({ deferred: true });
    mem_data = ko.observableArray<number>().extend({ deferred: true });
    sel_id = ko.observable<string | null>();
    procTableObj = ko.observable<any>();
    timer: number | null = null;

    updateLabels()
    {
        $.getJSON("/platform_info", (data: { data: interfaces.IPlatformInfoResponse }) =>
        {
            let d = data.data;

            //noinspection JSValidateTypes
            document.title = "Task Manager for " + d.machine_name;
            this.machine_name(d.machine_name);
            this.cpu_num(d.cpu_num);
            this.cpu_percent(d.cpu_percent + "%");
            this.total_mem(utils.Utils.fileSize(d.total_mem));
            this.available_mem(utils.Utils.fileSize(d.available_mem));
            this.percent_mem(d.percent_mem + "%");
            this.nproc($("#proc_list").find("tbody").find("tr").length);

            utils.Utils.push_and_remove(this.cpu_data, d.cpu_percent, this.plot_size);
            utils.Utils.push_and_remove(this.mem_data, d.percent_mem, this.plot_size);
        });
    }

    cpu_data_for_plot = ko.pureComputed(() =>
    {
        return _.zip(_.range(this.cpu_data().length), this.cpu_data());
    });

    mem_data_for_plot = ko.pureComputed(() =>
    {
        return _.zip(_.range(this.mem_data().length), this.mem_data());
    });

    setupSlider()
    {
        let init_val = this.interval / 1000;
        ($("#time_slider") as any).slider({
            value: init_val,
            min: 1,
            max: 60,
            step: 1,
            slide: function(_event: any, ui: any)
            {
                this.time_val(ui.value + "s");
            },
            change: function(_event: any, ui: any) 
            {
                clearInterval(this.timer);
                this.interval = ui.value * 1000;
                this.setTimeouts();
            }
        });
        this.time_val(`${init_val}s`);
    }

    setTimeouts()
    {
        this.timer = setInterval(() =>
        {
            let table = this.procTableObj();
            table.ajax.reload();
            table.draw();
            this.updateLabels();
        }, this.interval);
    }

    chooseSignal(): interfaces.ISignalChosen | null
    {
        let numS = prompt("Inserisci il codice relativo al segnale che vuoi inviare:", "15") ?? '';
        let num = parseInt(numS, 10);
        if(isNaN(num))
        {
            alert("Numero inserito non valido!");
            return null;
        }
        return { strnum: num, signum: num };
    }

    setupMenu()
    {
        let menu_sign: { [key: string]: interfaces.IMenuObj } = {};
        _.forOwn(signals, function(v, k)
        {
            menu_sign[v] = { name: "Send " + k, sigName: k, sigNum: +v };
        });
        menu_sign.choose = { name: "Input signal number" };

        ($ as any).contextMenu({
            selector: "#proc_list tbody tr",
            build: ($trigger: any): boolean | {} =>
            {
                if(!this.sel_id())
                {
                    return false;
                }
                $trigger = $("#" + this.sel_id());
                let name = $trigger.children().eq("0").text();
                let pid = $trigger.children().eq("1").text();
                return {
                    callback: (key: string) =>
                    {
                        let res;
                        if(key === "choose")
                            res = this.chooseSignal();
                        else
                        {
                            let opt = menu_sign[key];
                            if(opt)
                            {
                                res = {
                                    strnum: opt.sigName,
                                    signum: opt.sigNum
                                };
                            }
                        }

                        if(res && confirm("Vuoi davvero inviare il segnale " + res.strnum + " al processo " + name + "?"))
                        {
                            $.post("/kill", {
                                "pid": pid,
                                "signum": res.signum
                            },
                                data =>
                                {
                                    alert(data);
                                    this.sel_id(null);
                                });
                        }
                    },
                    items: menu_sign
                };
            }
        });
    }

    init()
    {
        this.updateLabels();
        this.setTimeouts();
        this.setupSlider();
        this.setupMenu();
    }
}

ko.bindingHandlers.plot = {
    init: function(element: any, _valueAccessor: any, allBindings: { get: (arg0: string) => any; })
    {
        let options = allBindings.get("plotOptions");
        options = _.defaults({
            ticks: 10,
            min: 0,
            max: 100
        }, options);

        let plot = ($ as any).plot(element, [
            []
        ], {
            yaxis: { min: options.min, max: options.max, ticks: options.ticks },
            xaxis: { show: false, min: 0, max: options.plot_size - 1 }
        });

        ko.utils.domData.set(element, "plot", plot);
    },

    update: function(element: any, valueAccessor: () => any)
    {
        let plot = ko.utils.domData.get(element, "plot");
        plot.setData([ko.unwrap(valueAccessor())]);
        plot.draw();
    }
};

ko.bindingHandlers.procTable = {
    init: function(element: any, valueAccessor: () => any)
    {
        let value = ko.unwrap(valueAccessor());
        let proc_table = $(element);
        let table = (proc_table as any).DataTable(
            {
                ajax: {
                    url: "/proc_info",
                    type: "GET"
                },
                paging: false,
                lengthChange: false,
                columns: [
                    { className: "dt-center" },
                    { className: "dt-center" },
                    { className: "dt-center" },
                    { className: "dt-center" },
                    { className: "dt-center" },
                    { className: "dt-center" },
                    { className: "dt-center" },
                    { className: "dt-left" }
                ],
                order: [0, "asc"],
                fnRowCallback: function(nRow: any, aData: string[])
                {
                    $(nRow).attr("id", "proc_" + aData[1]);
                    return nRow;
                },
                scrollY: document.body.scrollHeight - 200,
                columnDefs: [
                    {
                        render: function(data: number, type: string)
                        {
                            return (type === "display") ? utils.Utils.fileSize(data) : data;
                        },
                        targets: 4
                    }
                ]
            });
        proc_table.addClass("display compact nowrap");

        proc_table.find("tbody").on("click", "tr", function()
        {
            if($(this).hasClass("selected"))
            {
                $(this).removeClass("selected");
                value.sel_id(null);
            } else
            {
                table.$("tr.selected").removeClass("selected");
                $(this).addClass("selected");
                value.sel_id($(this).attr("id"));
            }
        });

        proc_table.on("draw.dt", function()
        {
            if(value.sel_id())
            {
                $("#" + value.sel_id()).addClass("selected");
            }
        });

        ko.utils.domData.set(element, "table", table);
        value.procTableObj(table);
    }
};

$(function()
{
    const vm = new AppViewModel();
    ko.applyBindings(vm);
    vm.init();
});