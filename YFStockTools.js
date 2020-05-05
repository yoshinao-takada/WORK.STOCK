
const YFStockTools =
{
    mod_jsdom : mod_jsdom = require("jsdom"),
    mod_fs : mod_fs = require("fs"),
    mod_path : mod_path = require("path"),
    mod_https : mod_https = require("https"),
    mod_assert : mod_assert = require("assert"),

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
    stockCodeFilePath  :   stockCodeFilePath = "DATA/JPXCodes.csv",
    // 市場インデックスコード.csvファイル
    stockIndexCodeFilePath : stockIndexCodeFilePath = "DATA/YF-index.csv",
    // stock code table標準ヘッダー(ファイルチェックのため使用)
    stdStockHeader  :   "code,class,name",
    // 統合コードテーブル(object配列)
    stockCodes : stockCodes = new Array(),

    // １日単位のデータ
    dailyValues : dailyValues = new Array(),

    /*!
    \brief discriminate '-intl-' code is contained or not.
    \return true if '-intl-' code is contained.
    */
    isIntl  :   function isIntl(key)
    {
        return (key.indexOf('-intl-') > 0);
    },

    /*!
    \brief read stock code table from .csv files
    */
    readCodes   :   function    readCodes(filePath)
    {
        var wholeText = YFStockTools.mod_fs.readFileSync(filePath, 'utf8');
        var lines = wholeText.split('\n');
        if (lines.length < 8)
        {
            throw new Error('table too small');
        }
        if (lines[0] != YFStockTools.stdStockHeader)
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
            var row = { code: cells[0], stockExchangeClass: cells[1], name: cells[2] };
            YFStockTools.stockCodes.push(row);
        }
    },

    /*!
    \brief read all stock code tables (.csv fiels)
    */
    readCodeTables  :   function readCodeTables()
    {
        YFStockTools.stockCodes = new Array();
        YFStockTools.readCodes(YFStockTools.stockCodeFilePath);
        YFStockTools.readCodes(YFStockTools.stockIndexCodeFilePath);
    },

    /*!
    \brief create a URL
    \param i [in] table index for YFStockTools.stockCodes[].
    \return URL string including search parameters.
    */
    getURL  :   function getURL(i)
    {
        var codeObj = YFStockTools.stockCodes[i];
        var urlopt = YFStockTools.isIntl(codeObj.stockExchangeClass) ?
            YFStockTools.YFIntlIndexPath : YFStockTools.YFStdPath;
        var url = urlopt.protocol + "://" + urlopt.domain + urlopt.path + codeObj.code;
        return url;
    },
    
    getDailyJP    :   function getDailyJP()
    {
        for (var i_code = 0; i_code != YFStockTools.stockCodes.length; i_code++)
        {
            if (YFStockTools.isIntl(YFStockTools.stockCodes[i_code].stockExchangeClass)) continue;
            var url = YFStockTools.getURL(i_code);
            console.log(url);
        }
    },

    getDailyIntl    :   function getDailyIntl()
    {
        for (var i_code = 0; i_code != YFStockTools.stockCodes.length; i_code++)
        {
            if (!YFStockTools.isIntl(YFStockTools.stockCodes[i_code].stockExchangeClass)) continue;
            var url = YFStockTools.getURL(i_code);
            console.log(url);
        }
    },

    debug_run   :   function    debug_run()
    {
        YFStockTools.readCodeTables();
        YFStockTools.getDailyJP();
    },
};

module.exports = 
{
    debug_run   :   YFStockTools.debug_run,
};