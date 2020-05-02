const mymod = require('./mymod');
const dataDirPath = mymod.makeDirPath(process.argv[1]);
const calPaths = mymod.getCalendarFilePaths(dataDirPath);
const dates = new Array(0); // create an empty array
const fileCount = calPaths.length;
for (var i_file = 0; i_file != fileCount; i_file++)
{
    var datesForEachYear = mymod.retrieveDates(calPaths[i_file]);
    const dateCount = datesForEachYear.length;
    for (var i_date = 0; i_date != dateCount; i_date++)
    {
        dates.push(datesForEachYear[i_date]);
    }
}
// datesにはUTCで保存されている。2000年1月1日 00:00:00はUTCでは1999-12-31 15:00:00になるので
// JSTに戻すためにはgetFullYear, getMonth等で取り出さなければならない。
console.log(`${dates[0].getFullYear()}-${dates[0].getMonth()+1}-${dates[0].getDate()}`);
console.log(dates[0]);