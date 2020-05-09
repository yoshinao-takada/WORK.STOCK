module.exports = {
    CreateCodeRecord : function(code, name, codeclass) {
        return { code: code, name : name, StockCodeClass: codeclass };
    },

    /*!
    \brief create a daily value object.
    \param code [in] stock code
    \param codeclass [in] stock market classifier
    \param current [in] current price
    \param open [in] opening price of the day
    \param prevclose [in] closing price of the previous day
    \parma low [in] lowest of the day
    \param high [in] highest of the day
    \param amount [in] stock count having moved in the day, NOT in currency unit but count of stock.
    */
    CreateDailyRecord : function(code, codeclass, current, open, prevclose, low, high, amount) {
        return {
            code: code, StockCodeClass : codeclass,
            values : {
                current : current, // current price
                prevclose: prevclose, open: open, low : low, high: high, amount: amount
            },
        };
    },

    DailyRecordHeader   :   
        "code,StockCodeClass," +
        "values.current,values.prevclose,values.open,values.low,values.high,values.amount",
    
    GetCsvString    :   function(dailyRecord)
    {
        var csvText = '';
        csvText += `${dailyRecord.code},${dailyRecord.StockCodeClass},`;
        return this.RetrieveAsCSV(dailyRecord.values, csvText);
    },

    RetrieveHeaderAsCSV : function(obj, beginWith)
    {
        const csvDelimiter = ','
        var csvtext = (beginWith == undefined) ? '' : beginWith;
        var delimiter = '';
        for (i in obj)
        {
            csvtext += `${delimiter}${i}`;
            delimiter = csvDelimiter;
        }
        return csvtext;
    },

    RetrieveAsCSV : function(obj, beginWith)
    {
        const csvDelimiter = ','
        var csvtext = (beginWith == undefined) ? '' : beginWith;
        var delimiter = '';
        for (i in obj)
        {
            csvtext += `${delimiter}${obj[i]}`;
            delimiter = csvDelimiter;
        }
        return csvtext;
    }
}