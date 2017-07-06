export interface IPlatformInfoResponse {
    machine_name: string;
    cpu_num: number;
    cpu_percent: number;
    total_mem: number;
    available_mem: number;
    percent_mem: number;
}

export interface ISignalChosen {
    strnum: number;
    signum: number;
}

export interface IMenuObj {
    name: string;
    sigName?: string;
    sigNum?: number;
}