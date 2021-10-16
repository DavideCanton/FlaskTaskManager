import 'datatables';
import 'jquery-contextmenu';
import 'jquery-ui';
import 'jquery-ui/ui/widgets/slider';
import 'jquery.flot';
import { applyBindings, bindingHandlers, observable, observableArray, pureComputed, unwrap, utils } from 'knockout';
import _ from 'lodash';
import { IMenuObj, IPlatformInfoResponse, ISignalChosen } from './interfaces';
import './styles';
import { fileSize, push_and_remove } from './utils';

let signals: Record<string, number>;

export class AppViewModel
{
    interval = 3000;
    plot_size = 30;

    machine_name = observable<string>();
    cpu_num = observable<number>();
    cpu_percent = observable<string>();
    total_mem = observable<string>();
    available_mem = observable<string>();
    percent_mem = observable<string>();
    nproc = observable<number>();
    time_val = observable<string>();
    cpu_data = observableArray<number>().extend({ deferred: true });
    mem_data = observableArray<number>().extend({ deferred: true });
    sel_id = observable<string | null>();
    procTableObj = observable<DataTables.Api>();
    timer: any | null = null;

    updateLabels()
    {
        $.getJSON("/platform_info")
            .then((data: { data: IPlatformInfoResponse }) =>
            {
                let d = data.data;

                document.title = `Task Manager for ${d.machine_name}`;
                this.machine_name(d.machine_name);
                this.cpu_num(d.cpu_num);
                this.cpu_percent(`${d.cpu_percent}%`);
                this.total_mem(fileSize(d.total_mem));
                this.available_mem(fileSize(d.available_mem));
                this.percent_mem(`${d.percent_mem}%`);
                this.nproc($("#proc_list").find("tbody").find("tr").length);

                push_and_remove(this.cpu_data, d.cpu_percent, this.plot_size);
                push_and_remove(this.mem_data, d.percent_mem, this.plot_size);
            });
    }

    cpu_data_for_plot = pureComputed(() =>
    {
        return _.zip(_.range(this.cpu_data().length), this.cpu_data());
    });

    mem_data_for_plot = pureComputed(() =>
    {
        return _.zip(_.range(this.mem_data().length), this.mem_data());
    });

    setupSlider()
    {
        const init_val = this.interval / 1000;
        $("#time_slider").slider({
            value: init_val,
            min: 1,
            max: 60,
            step: 1,
            slide: (_event: any, ui: any) =>
            {
                this.time_val(`${ui.value}s`);
            },
            change: (_event: any, ui: any) =>
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
            if(table)
            {
                table.ajax.reload();
                table.draw();
                table.columns.adjust();
            }
            this.updateLabels();
        }, this.interval);
    }

    chooseSignal(): ISignalChosen | null
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
        let menu_sign: Record<string, IMenuObj> = {};
        _.forOwn(signals, function(sigNum, sigName)
        {
            menu_sign[sigNum] = { name: `Send ${sigName}`, sigName, sigNum };
        });
        menu_sign.choose = { name: "Input signal number" };

        $.contextMenu({
            selector: "#proc_list tbody tr",
            build: ($trigger: any): boolean | {} =>
            {
                const selId = this.sel_id();
                if(!selId)
                    return false;

                $trigger = $(`#${selId}`);
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
                                res = { strnum: opt.sigName, signum: opt.sigNum };
                        }

                        if(res && confirm(`Vuoi davvero inviare il segnale ${res.strnum} al processo ${name}?`))
                        {
                            $.post(
                                "/kill",
                                { pid, signum: res.signum }
                            ).then(data =>
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

bindingHandlers.plot = {
    init: function(element: any, _valueAccessor: any, allBindings: { get: (arg0: string) => any; })
    {
        let options = allBindings.get("plotOptions");
        options = _.defaults({
            ticks: 10,
            min: 0,
            max: 100
        }, options);

        let plot = $.plot(element, [
            []
        ], {
            yaxis: { min: options.min, max: options.max, ticks: options.ticks },
            xaxis: { show: false, min: 0, max: options.plot_size - 1 }
        });

        utils.domData.set(element, "plot", plot);
    },

    update: function(element: any, valueAccessor: () => any)
    {
        let plot = utils.domData.get(element, "plot");
        plot.setData([unwrap(valueAccessor())]);
        plot.draw();
    }
};

bindingHandlers.procTable = {
    init: function(element: any, valueAccessor: () => any)
    {
        let value = unwrap(valueAccessor());
        let proc_table = $(element);
        let table = proc_table.DataTable(
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
                rowCallback: (nRow: any, aData: object | any[]) =>
                {
                    if(_.isArray(aData))
                        $(nRow).attr("id", `proc_${aData[1]}`);
                    return nRow;
                },
                scrollY: `${document.body.scrollHeight - 200}px`,
                columnDefs: [
                    {
                        render: (data: number, type: string) => type === "display" ? fileSize(data) : data,
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

        utils.domData.set(element, "table", table);
        value.procTableObj(table);
    }
};

$(function()
{
    const vm = new AppViewModel();
    applyBindings(vm);
    vm.init();
});