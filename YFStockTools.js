
const YFStockTools =
{
    mod_jsdom : mod_jsdom = require("jsdom"),
    mod_fs : mod_fs = require("fs"),
    mod_path : mod_path = require("path"),
    mod_https : mod_https = require("https"),
    mod_assert : mod_assert = require("assert"),
    mod_of  :   mod_of = require("./ObjFactory"),
    mod_util    : mod_util = require("util"),

    // Yahoo japan finance 国内標準銘柄情報
    YFStdPath : {
        protocol    :   "https",
        domain  :  "stocks.finance.yahoo.co.jp",
        path : "/stocks/detail/?code=",
    },
    // yahoo japan finance 国際市場インデックス情報
    YFIntlIndexPath :   {
        protocol    :   "https",
        domain  :  "finance.yahoo.co.jp",
        path : "/quote/",
    },
    // 個別銘柄コード.csvファイル
    stockCodeFilePath  :   "DATA/JPXCodes.csv",
    // 市場インデックスコード.csvファイル
    stockIndexCodeFilePath : "DATA/YF-index.csv",
    // stock code table標準ヘッダー(ファイルチェックのため使用)
    stdStockHeader  :   "code,class,name",
    // 統合コードテーブル(object配列)
    stockCodes : stockCodes = new Array(),
    // １日単位のデータ
    dailyValues : dailyValues = new Array(),
    // 実行中のhttps requests
    runningRequests :   runningRequests = 0,
    runningRequestsLimit    :   runningRequestsLimit = 30,
    // resulted dailyValues save path
    IntlSavePath    :   "DATA/Daily-intl.csv",
    DomesticSavePath    :   "DATA/Daily-domestic.csv",
    codeIndex  :   0,
    completed : true,

    /*!
    \brief create a record of stock code table
    \param code [in] stock code
    \param name [in] item name (company name or market index name)
    \param class [in] stock market class
    */
    /*!
    \brief discriminate '-intl-' code is contained or not.
    \return true if '-intl-' code is contained.
    */
    isIntl  :   function(key)
    {
        return (key.indexOf('-intl-') > 0);
    },

    /*!
    \brief discriminate 'YF-index' code is.
    \return true if key == 'YF-index'.
    */
    isYFJPIndex :   function(key)
    {
        return (key == 'YF-index');
    },


    getURL : function(codeRecord)
    {
        var urlProperties = YFStockTools.isIntl(codeRecord.StockCodeClass) ?
            YFStockTools.YFIntlIndexPath : YFStockTools.YFStdPath;
        var url = urlProperties.protocol + '://' + urlProperties.domain + urlProperties.path +
                codeRecord.code;
        return url;
    },

    /*!
    \brief read stock code table from .csv files to initialize stock code table,
        YFStockTools.stockCodes.
    */
    readCodes   :   function(filePath)
    {
        var wholeText = this.mod_fs.readFileSync(filePath, 'utf8');
        var lines = wholeText.split('\n');
        if (lines.length < 8)
        {
            throw new Error('table too small');
        }
        if (lines[0] != this.mod_of.RetrieveHeaderAsCSV(this.mod_of.CreateCodeRecord()))
        {
            throw new Error(`invalid header = ${lines[0]}`);
        }
        for (var i_line = 1; i_line != lines.length; i_line++)
        {
            if (lines[i_line].length < 3) continue; // skip empty line
            var cells = lines[i_line].split(',');
            if (cells.length != 3)
            {
                throw new Error(`invalid line[${i_line}: ${lines[i_line]}]`);
            }
            var row = this.mod_of.CreateCodeRecord(cells[0], cells[1], cells[2]);
            this.stockCodes.push(row);
        }
    },

    /*!
    \brief read all stock code tables (.csv fiels). There are now two table files,
    YFStockTools.stockCodeFilePath and YFStockTools.stockIndexCodeFilePath
    */
    readCodeTables  :   function()
    {
        YFStockTools.stockCodes = new Array();
        YFStockTools.readCodes(YFStockTools.stockCodeFilePath);
        YFStockTools.readCodes(YFStockTools.stockIndexCodeFilePath);
    },

    removeComma : function(str)
    {
        var strReturn = '';
        for (var i = 0; i != str.length; i++)
        {
            if (str[i] != ',')
            {
                strReturn += str[i];
            }
        }
        return strReturn;
    },

    /*!
    \brief get daily info from the full HTML text of JP stock market of
    stock.finance.yahoo.co.jp.
    \param code [in] stock code
    \param name [in] name of company or stock market index
    \param htmlText [in]
    \return daily data record
    */
    retrieveDailyRecord :   function(codeRecord, htmlText)
    {
        var domdocBody = (new this.mod_jsdom.JSDOM(htmlText)).window.document.querySelector('body');
        var dailyRecord = this.mod_of.CreateDailyRecord(
            codeRecord.code, codeRecord.StockCodeClass);

        if (this.isIntl(codeRecord.StockCodeClass))
        { // International stock market index
            var ddNodes = domdocBody.querySelectorAll('span._3BGK5SVf');
            dailyRecord.values.current = parseFloat(this.removeComma(ddNodes[0].textContent));
            dailyRecord.values.prevclose = parseFloat(this.removeComma(ddNodes[3].textContent));
            dailyRecord.values.open = parseFloat(this.removeComma(ddNodes[4].textContent));
            dailyRecord.values.high = parseFloat(this.removeComma(ddNodes[5].textContent));
            dailyRecord.values.low = parseFloat(this.removeComma(ddNodes[6].textContent));
            dailyRecord.values.amount = parseFloat(this.removeComma(ddNodes[7].textContent));
        }
        else
        { // Domestic indivisual stock code or domestic stock market index
            var ddNodes = domdocBody.querySelectorAll('dd.mar0');
            var curPriceNodes = domdocBody.querySelectorAll('td.stoksPrice');
            var curPriceNode = curPriceNodes[curPriceNodes.length-1];
            dailyRecord.values.current = parseFloat(this.removeComma(
                curPriceNode.textContent
            ));
            dailyRecord.values.prevclose = parseFloat(this.removeComma(
                ddNodes[0].querySelector('strong').textContent
            ));
            dailyRecord.values.open = parseFloat(this.removeComma(
                ddNodes[1].querySelector('strong').textContent
            ));
            dailyRecord.values.high = parseFloat(this.removeComma(
                ddNodes[2].querySelector('strong').textContent
            ));
            dailyRecord.values.low = parseFloat(this.removeComma(
                ddNodes[3].querySelector('strong').textContent
            ));
            // finance.yahoo.co.jp for stock market index does not show daily amount.
            dailyRecord.values.amount = (this.isYFJPIndex(codeRecord.StockCodeClass)) ?
                0.0 :
                parseFloat(this.removeComma(ddNodes[4].querySelector('strong').textContent));
        }
        return dailyRecord;
    },


    skipForDomestic : function(codeIndex)
    {
        while ((codeIndex < YFStockTools.stockCodes.length) &&
            YFStockTools.isIntl(YFStockTools.stockCodes[codeIndex].StockCodeClass))
        {
            codeIndex++;
        }
        return codeIndex;
    },

    skipForIntl    :   function(codeIndex)
    {
        while ((codeIndex < YFStockTools.stockCodes.length) &&
            !YFStockTools.isIntl(YFStockTools.stockCodes[codeIndex].StockCodeClass))
        {
            codeIndex++;
        }
        return codeIndex;
    },

    /*!
    \brief get international items; international stock market indices
    */
    getIntlRecord : function()
    {
        let result = false;
        console.log(`@getIntlRecord(), codeInex=${this.codeIndex}, stockCodes.length=${this.stockCodes.length}`);
        do {
            if (this.codeIndex == 0)
            {
                this.runningRequests = 0;
                this.dailyValues = new Array();
            }
            this.codeIndex = this.skipForIntl(this.codeIndex);
            console.log(`@getIntlRecord(), codeInex=${this.codeIndex}, stockCodes.length=${this.stockCodes.length}`);
            if (this.stockCodes.length == this.codeIndex)
            { // end of processing
                break;
            }
            if (this.runningRequests >= this.runningRequestsLimit)
            { // too many running requests exists and supend this request.
                setImmediate(this.getIntlRecord);
                break;
            }
            // create a new HTTPS request
            var codeRecord = this.stockCodes[this.codeIndex];
            let url = this.getURL(codeRecord);
            let req = this.mod_https.get(url, (res) => {
                this.runningRequests++;
                res.setEncoding('utf8');
                let htmlText = '';
                res.on('data', (chunk)=>{ htmlText += chunk; });
                res.on('end', () => {
                    let dailyRecord = this.retrieveDailyRecord(codeRecord, htmlText);
                    console.log(dailyRecord);
                    this.dailyValues.push(dailyRecord);
                    this.runningRequests--;
                    if ((this.runningRequests == 0) && (this.codeIndex == (this.stockCodes.length-1)))
                    { // all the requests has been completed.
                        this.saveDaily(this.IntlSavePath);
                        this.completed = true;
                    }
                });
                if (this.codeIndex < (this.stockCodes.length - 1))
                {
                    this.codeIndex++;
                    this.getIntlRecord();
                }
            });
        } while (false);
        return result;
    },

    getDomesticRecord : function()
    {
        let result = false;
        console.log(`@getDomesticRecord(), codeInex=${this.codeIndex}, stockCodes.length=${this.stockCodes.length}`);
        do {
            if (this.codeIndex == 0)
            {
                this.runningRequests = 0;
                this.dailyValues = new Array();
            }
            this.codeIndex = this.skipForDomestic(this.codeIndex);
            console.log(`@getDomesticRecord(), codeInex=${this.codeIndex}, stockCodes.length=${this.stockCodes.length}`);
            if (this.stockCodes.length == this.codeIndex)
            { // end of processing
                break;
            }
            if (this.runningRequests >= this.runningRequestsLimit)
            { // too many running requests exists and supend this request.
                setImmediate(this.getDomesticRecord);
                break;
            }
            // create a new HTTPS request
            var codeRecord = this.stockCodes[this.codeIndex];
            let url = this.getURL(codeRecord);
            let req = this.mod_https.get(url, (res) => {
                this.runningRequests++;
                res.setEncoding('utf8');
                let htmlText = '';
                res.on('data', (chunk)=>{ htmlText += chunk; });
                res.on('end', () => {
                    let runningCodeRecord = codeRecord;
                    let dailyRecord = this.retrieveDailyRecord(runningCodeRecord, htmlText);
                    console.log(dailyRecord);
                    this.dailyValues.push(dailyRecord);
                    this.runningRequests--;
                    if ((this.runningRequests == 0) && 
                        (this.codeIndex >= (this.stockCodes.length-1)))
                    { // all the requests has been completed.
                        this.saveDaily(this.DomesticSavePath);
                        this.completed = true;
                    }
                });
                if (this.codeIndex < (this.stockCodes.length - 1))
                {
                    this.codeIndex++;
                    this.getDomesticRecord();
                }
            });
        } while (false);
        return result;
    },

    saveDaily   :   function(filePath)
    {
        console.log(`@saveDaily(), filePath=${filePath}`);
        let csvText = this.mod_of.DailyRecordHeader + '\n';
        for (let i = 0; i != this.dailyValues.length; i++)
        {
            csvText += this.mod_of.GetCsvString(this.dailyValues[i]) + '\n';
        }
        this.mod_fs.writeFileSync(filePath, csvText, 'utf8');
    },

    getIntlDaily   :   function()
    {
        if (YFStockTools.completed)
        {
            YFStockTools.completed = false;
            YFStockTools.codeIndex = 0;
            YFStockTools.readCodeTables();
            YFStockTools.getIntlRecord();
        }
        else
        {
            setImmediate(YFStockTools.getIntlDaily);
        }
    },

    getDomesticDaily    :   function()
    {
        if (YFStockTools.completed)
        {
            YFStockTools.completed = false;
            YFStockTools.codeIndex = 0;
            YFStockTools.readCodeTables();
            YFStockTools.getDomesticRecord();
        }
        else
        {
            setImmediate(YFStockTools.getDomesticDaily);
        }
    }
};

module.exports = 
{
    funcUT1  :   YFStockTools.retrieveDailyRecord,
    funcUT2 :   YFStockTools.getURL,
    funcUT3 :   YFStockTools.getIntlDaily,
    funcUT4 :   YFStockTools.getDomesticDaily,
};