import * as ko from 'knockout';

export class Utils
{
    static fileSize(a: number): string
    {
        var e = Math.log(a) / Math.log(1024) | 0;
        return (a / Math.pow(1024, e)).toFixed(2)
            + ' ' + (e ? 'KMGTPEZY'[--e] + 'iB' : 'Bytes');
    }

    static push_and_remove<T>(array: ko.MaybeObservableArray<T>, data: T, plot_size: number)
    {
        array = ko.unwrap(array);

        array.push(data);
        if(array.length > plot_size)
            array.shift();
    }

};
