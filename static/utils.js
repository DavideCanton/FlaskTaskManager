var Utils = {
    fileSize: function (a)
    {
        var e = Math.log(a) / Math.log(1024) | 0;
        return (a / Math.pow(1024, e)).toFixed(2)
            + ' ' + (e ? 'KMGTPEZY'[--e] + 'iB' : 'Bytes');
    },

    push_and_remove: function (array, data, plot_size)
    {
        array.push(data);
        if (array().length > plot_size)
            array.shift();
    }

};
