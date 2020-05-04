const JPHolidayTools = {
    mod_jsdom : mod_jsdom = require("jsdom"),
    mod_fs : mod_fs = require("fs"),
    mod_path : mod_path = require("path"),

    /*!
    \brief make the path of DATA subfolder.
    \param scriptPath [in] js main script path in process.argv[1].
    \param childDir [in] directory path relative to the directory of scriptPath.
    \return subfolder path
    */
    makeDirPath: function makeDirPath(scriptPath, childDir)
    {
        return mod_path.join(
            mod_path.dirname(scriptPath),
            "DATA");
    },

    isDigit : function isDigit(c)
    {
        return ('0' <= c && c <= '9');
    },

    /*!
    \brief return true only when str is decimal four digits.
    */
    isFullYear : function isFullYear(s)
    {
        var b = true;
        if (s.length != 4)
        {
            return false;
        }
        for (var i = 0; i != 4; i++)
        {
            b = b && JPHolidayTools.isDigit(s[i]);
        }
        return b;
    },

    /*!
    \brief get the list of the HTML files in the directory specified by dataDirPath.
    \param dataDirPath [in] data directory path.
    \return string array of file paths.
    */
    getCalendarFilePaths : function getCalendarFilePaths(dataDirPath)
    {
        var paths = [];
        var children = mod_fs.readdirSync(dataDirPath);
        for (var i in children)
        {
            var fname = children[i];
            var extension = mod_path.extname(fname);
            var base = mod_path.basename(fname, ".html");
            if ((extension == ".html") && JPHolidayTools.isFullYear(base))
            {
                paths.push(mod_path.join(dataDirPath, fname));
            }
        }
        return paths;
    },

    retrieveDateStrings : function retrieveDateStrings(calendar)
    {
        console.log(calendar);
        const wholeText = mod_fs.readFileSync(calendar, 'utf8');
        const { JSDOM } = mod_jsdom;
        const { document } = (new JSDOM(wholeText)).window;
        try 
        {
            const shukuList = document.querySelector("#ShukuList");
            const dateElements = shukuList.querySelectorAll(".SH_dt");
            const dateCount = dateElements.length;
            var dates = new Array(dateCount); // declare date array as an empty array
            for (var i = 0; i != dateCount; i++)
            {
                dates[i] = dateElements[i].textContent;
            }
            return dates;
        }
        catch (exc_retrieveDates)
        {
            throw exc_retrieveDates;
        }
    },

    parseJPDate : function parseJPDate(datestring)
    {
        var yyyy = 0;
        var mm = 0;
        var dd = 0;
        var n = datestring.length;
        var state = 0;
        for (var i = 0; i != n; i++)
        {
            var c = datestring[i];
            switch (state)
            {
                case 0:
                    if (this.isDigit(c))
                    {
                        yyyy = yyyy * 10 + parseInt(c);
                    }
                    else
                    {
                        state++;
                    }
                    break;
                case 1:
                    if (this.isDigit(c))
                    {
                        mm = mm * 10 + parseInt(c);
                    }
                    else
                    {
                        state++;
                    }
                    break;
                case 2:
                    if (this.isDigit(c))
                    {
                        dd = dd * 10 + parseInt(c);
                    }
                    break;
                default:
                    break;
            }
        }
        return new Date(yyyy, mm-1, dd);
    },

    retrieveDates : function retrieveDates(calendar)
    {
        var dateStrings = this.retrieveDateStrings(calendar);
        const dateCount = dateStrings.length;
        var dates = new Array(dateCount);
        for (var i_date = 0; i_date != dateCount; i_date++)
        {
            dates[i_date] = this.parseJPDate(dateStrings[i_date]);
        }
        return dates;
    }
};

module.exports = {
    /*!
    \breif get a list of calendar file paths in DATA subfolder.
    \return array of strings containing the file paths.
    */
    getCalendarFilePaths : JPHolidayTools.getCalendarFilePaths,

    /*!
    \brief retrieve dates in each calendar file.
    \param calendar [in] file path to calendar html file
    \return array of dates of national holidays in each calendar.
    */
    retrieveDateStrings : JPHolidayTools.retrieveDateStrings,

    /*!
    \brief get the project DATA subfolder converted from the script path
    in process.args[1].
    \param scriptPath [in] is retrieved by process.args[1].
    \return the project data directory path
    */
    makeDirPath : JPHolidayTools.makeDirPath,

    /*!
    \brief check if the character is one of decimal digits, i.e. '0'..'9'
    \param c [in] a character
    */
    isDigit : JPHolidayTools.isDigit,

    /*!
    \brief parse a date string formated in Japanese style like 2010年8月31日
    */
    parseJPDate : JPHolidayTools.parseJPDate,

    /*!
    \brief retrieve date objects from the html text specified the file path
    */
    retrieveDates : JPHolidayTools.retrieveDates,
};