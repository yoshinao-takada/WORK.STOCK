const JPXCodeTools = {
    mod_jsdom : mod_jsdom = require("jsdom"),
    mod_fs : mod_fs = require("fs"),
    mod_path : mod_path = require("path"),
    mod_https : mod_https = require("https"),
    mod_EventEmitter : mod_EventEmitter = require("events"),
    mod_assert : mod_assert = require("assert"),
    resultSavePath : resultSavePath = "DATA/JPXCodes.csv",

    // yahoo finance web page search keys
    YFKeys : {
        Protocol : "https",
        Domain : "stocks.finance.yahoo.co.jp",
        Path : "/stocks/qi/",
        BaseURL :   BaseURL = "https://stocks.finance.yahoo.co.jp/stocks/qi/",
        GyoshuTop : [
            { name : "Suisan", code : "?ids=0050"},
            { name : "Mining", code : "?ids=1050"},
            { name : "Construction", code : "?ids=2050"},
            { name : "Foods", code : "?ids=3050"},
            { name : "Fabrics", code : "?ids=3100"},
            { name : "Pulp", code :  "?ids=3150"},
            { name : "Chemical", code : "?ids=3200"},
            { name : "Medical", code : "?ids=3250"},
            { name : "Petral", code : "?ids=3300"},
            { name : "Rubber", code : "?ids=3350"},
            { name : "Glass", code : "?ids=3400"},
            { name : "Steel", code : "?ids=3450"},
            { name : "Metal", code : "?ids=3500"},
            { name : "MetalWorks", code : "?ids=3550"},
            { name : "Machine", code : "?ids=3600"},
            { name : "Electronics", code : "?ids=3650"},
            { name : "TransportMachine", code : "?ids=3700"},
            { name : "Precision", code : "?ids=3750"},
            { name : "Others", code : "?ids=3800"},
            { name : "Energy", code : "?ids=4050"},
            { name : "LandTransport", code : "?ids=5050"},
            { name : "SeeTransport", code : "?ids=5100"},
            { name : "AirTransport", code : "?ids=5150"},
            { name : "Warehouse", code : "?ids=5200"},
            { name : "Information", code : "?ids=5250"},
            { name : "Wholesale", code : "?ids=6050"},
            { name : "Retail", code : "?ids=6100"},
            { name : "Bank", code : "?ids=7050"},
            { name : "StockSecurity", code : "?ids=7100"},
            { name : "Insurance", code : "?ids=7150"},
            { name : "OtherFinancial", code : "?ids=7200"},
            { name : "RealEstate", code : "?ids=8050"},
            { name : "Service", code : "?ids=9050"},
        ],
        ClassKey_Link : "div.s150",
        ClassKey_Tr :   ".yjM",
        ClassKey_Code   :   ".yjM",
        ClassKey_Name   :   ".yjMt",
    },
    gyoshuCodes : gyoshuCodes = new Array(),
    hasMoreData : hasMoreData = new Array(),

    /*!
    \param document [in] DOM document
    \return link to the next page if exist.
    */
    getLink     :   function    getLink(document)
    {
        var link = null;
        linkNodes = document.querySelectorAll(JPXCodeTools.YFKeys.ClassKey_Link);
        if (linkNodes.length != 2)
        {
            return link;
        }
        var linkNode = linkNodes[1].firstChild.nextSibling.nextSibling.nextSibling;
        link = linkNode.href;
        return link;
    },

    getURL : function getURL(index)
    {
        return JPXCodeTools.YFKeys.Protocol + "://" + JPXCodeTools.YFKeys.Domain +
            JPXCodeTools.YFKeys.Path + JPXCodeTools.YFKeys.GyoshuTop[index].code;
    },

    getURL2 : function GetURL2(relpath)
    {
        return JPXCodeTools.YFKeys.Protocol + "://" + JPXCodeTools.YFKeys.Domain + relpath;
    },

    noMoreData : function noMoreData()
    {
        var hasMoreData_ = false;
        for (var i = 0; i != JPXCodeTools.hasMoreData.length; i++)
        {
            hasMoreData_ = hasMoreData_ || JPXCodeTools.hasMoreData[i];
        }
        return !hasMoreData_;
    },

    saveGyoshuCodes : function saveGyoshuCodes()
    {
        console.log(`@saveGyoshuCodes(),savePath=${JPXCodeTools.resultSavePath}`);
        var csvText = "code,class,name\n";
        for (var i_gyoshu =0; i_gyoshu != JPXCodeTools.gyoshuCodes.length; i_gyoshu++)
        {
            for (var i_sub = 0;i_sub != JPXCodeTools.gyoshuCodes[i_gyoshu].length; i_sub++)
            {
                var infoBlock = JPXCodeTools.gyoshuCodes[i_gyoshu][i_sub];
                for (var i = 0; i != infoBlock.length; i++)
                {
                    var info = infoBlock[i];
                    var rowText = `${info.code},${info.stockExchangeClass},${info.name}\n`;
                    csvText += rowText;
                }
            }
        }
        JPXCodeTools.mod_fs.writeFileSync(JPXCodeTools.resultSavePath, csvText, 'utf8');
    },

    startGetRequest :   function startGetRequest(url, gyoshuIndex, subIndex)
    {
        console.log(`url=${url}, gyoshu=${gyoshuIndex}, sub=${subIndex}`);
        var htmlText = '';
        var req = JPXCodeTools.mod_https.get(url, (res)=>{
            res.setEncoding('utf8'); // これがないと文字化けする。多バイト文字がバッファーの切れ目にかかる時も適切に処理される。
            res.on('data', (d) => { htmlText += d; });
            res.on('end', ()=> {
                var savePath = JPXCodeTools.mod_path.join('DATA', ''+gyoshuIndex+'-'+subIndex);
                var link = JPXCodeTools.processDocument(htmlText, gyoshuIndex, subIndex);
                if (link == null)
                {
                    JPXCodeTools.hasMoreData[gyoshuIndex] = false;
                    if (JPXCodeTools.noMoreData())
                    {
                        JPXCodeTools.saveGyoshuCodes();
                    }
                }
                else
                {
                    var nextURL = JPXCodeTools.getURL2(link);
                    JPXCodeTools.startGetRequest(nextURL, gyoshuIndex, subIndex+1);
                }
            });
        });
    },

    /*!
    \brief process an HTML document in text representation
    \param htmlText [in] utf-8 HMLT text
    \param gyoshuIndex [in] index for JPXCodeTools.FYKeys.GyoshuTop.
    \param subIndex [in] index for muti-pages
    \return link to the next page if exists. Otherwise, null
    */
    processDocument :   function processDocument(htmlText,gyoshuIndex,subIndex)
    {

        var domdocument = new JPXCodeTools.mod_jsdom.JSDOM(htmlText).window.document;
        // retrieve in-page table of stock codes and company names.
        var tableNode = domdocument.querySelector("table.yjS");
        var codeNodes = tableNode.querySelectorAll("td.yjM");
        var stockExchangeClassNodes = tableNode.querySelectorAll("td.yjSt");
        var companyNameNodes = tableNode.querySelectorAll("strong.yjMt");

        // DEBUG
        // var savePath = `DATA/DEBUGINFO_${gyoshuIndex}-${subIndex}.txt`;
        // var retrieveSummary = `code:${codeNodes.length},exclass:${stockExchangeClassNodes.length},company:${companyNameNodes.length}`;
        // var retrieveSummaryComment = `<!-- ${retrieveSummary} -->`
        // JPXCodeTools.mod_fs.writeFileSync(savePath, htmlText + retrieveSummaryComment, 'utf8');
        // console.log(`@processDocument():${savePath},${codeNodes.length},${stockExchangeClassNodes.length},${companyNameNodes.length}`);
        // END DEBUG

        JPXCodeTools.mod_assert(
            (codeNodes.length == stockExchangeClassNodes.length) &&
            (codeNodes.length == companyNameNodes.length)
        );
        JPXCodeTools.mod_assert(codeNodes.length > 0);
        var infoSummary = new Array(codeNodes.length);
        for (var i = 0; i != codeNodes.length; i++)
        {
            infoSummary[i] = {
                code: codeNodes[i].firstChild.textContent,
                stockExchangeClass: stockExchangeClassNodes[i].textContent,
                name: companyNameNodes[i].firstChild.textContent,
            };
        }
        JPXCodeTools.gyoshuCodes[gyoshuIndex][subIndex] = infoSummary;
        return JPXCodeTools.getLink(domdocument);
    },

    debug_run   :   function    debug_run(scriptPath)
    {
        var n_gyoshu = JPXCodeTools.YFKeys.GyoshuTop.length;
        var hasMoreData = true;
        // init gyoshuCodes
        JPXCodeTools.gyoshuCodes = new Array(n_gyoshu);
        JPXCodeTools.hasMoreData = new Array(n_gyoshu);
        for (var i_gyoshu = 0; i_gyoshu != n_gyoshu; i_gyoshu++)
        {
            JPXCodeTools.gyoshuCodes[i_gyoshu] = new Array();
            JPXCodeTools.hasMoreData[i_gyoshu] = true;
        }
        // process HTML documents
        for (var i_gyoshu = 0; i_gyoshu != n_gyoshu; i_gyoshu++)
        {
            var url = JPXCodeTools.getURL(i_gyoshu);
            JPXCodeTools.startGetRequest(url, i_gyoshu, 0);
        }
    },
};

module.exports = {
    debug_run   :   JPXCodeTools.debug_run,
};