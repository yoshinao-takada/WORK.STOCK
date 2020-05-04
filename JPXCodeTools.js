const JPXCodeTools = {
    mod_jsdom : mod_jsdom = require("jsdom"),
    mod_fs : mod_fs = require("fs"),
    mod_path : mod_path = require("path"),
    mod_https : mod_https = require("https"),
    mod_EventEmitter : mod_EventEmitter = require("events"),
    emitter : emitter = new mod_EventEmitter(),
    gyoshuCodes : gyoshuCodes = new Array(),

    // yahoo finance web page search keys
    YFKeys : {
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
        var linkNodeText = linkNode.outerHTML;
        var doubleQuotePos0 = linkNodeText.indexOf('"');
        var doubleQuotePos1 = linkNodeText.lastIndexOf('"');
        console.log(linkNodeText.substr(doubleQuotePos0 + 1, doubleQuotePos1 - doubleQuotePos0 - 1));
    },

    /*!
    \param document [in] DOM document
    \return array of { code,name } pair
    */
    getCodesAndNames    :   function    getCodesAndNames(document)
    {
        tableNodes = document.querySelectorAll(JPXCodeTools.YFKeys.ClassKey_Code);
        console.log(tableNodes);
    },

    getURL : function getURL(index)
    {
        return JPXCodeTools.YFKeys.BaseURL +
            JPXCodeTools.YFKeys.GyoshuTop[index].code;
    },

    startGetRequest :   function startGetRequest(url, gyoshuIndex, subIndex)
    {
        var myopt = { url: url, gyoshu: gyoshuIndex, sub: subIndex, htmlText: '' };
        console.log(`URL=${url}`);
        var req = JPXCodeTools.mod_https.get(url, (res)=>{
            res.on('data', (d) => { myopt.htmlText += d; });
            res.on('end', ()=> {
                var savePath = JPXCodeTools.mod_path.join('DATA', ''+myopt.gyoshu+'-'+myopt.sub);
                console.log(`savePath=${savePath}`);
                JPXCodeTools.mod_fs.writeFileSync(savePath, myopt.htmlText, 'utf8');
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
        const { domdocument } = (new this.mod_jsdom(htmlText)).window;
        return JPXCodeTools.getLink(domdocument);
    },

    debug_run   :   function    debug_run(scriptPath)
    {
        var n_gyoshu = JPXCodeTools.YFKeys.GyoshuTop.length;
        var hasMoreData = true;
        // init gyoshuCodes
        for (var i_gyoshu = 0; i_gyoshu != n_gyoshu; i_gyoshu++)
        {
            gyoshuCodes[i_gyoshu] = new Array();
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