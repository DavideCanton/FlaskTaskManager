import { ObservableArray } from "knockout";

export function fileSize(a: number): string
{
    var e = Math.log(a) / Math.log(1024) | 0;
    return (a / Math.pow(1024, e)).toFixed(2)
        + ' ' + (e ? 'KMGTPEZY'[--e] + 'iB' : 'Bytes');
}

export function push_and_remove<T>(array: ObservableArray<T>, data: T, plot_size: number)
{
    array.push(data);
    if(array.length > plot_size)
        array.shift();
}
