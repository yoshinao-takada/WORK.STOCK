// Javascript: Object Oriented Programming
// Page 65[phyiscal page 62]

const of = require('./ObjFactory');
const StTools = require('./YFStockTools');
const fs = require('fs');
const jsdom = require('jsdom');

var htmlText = fs.readFileSync('shanghai.html', 'utf8');
var codeObj = of.CreateCodeRecord('1333', 'マルハニチロ', '東証1部');
var url = StTools.funcUT2(codeObj, htmlText);
console.log(url);
//StTools.funcUT3();

StTools.funcUT4();