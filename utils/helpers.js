
const fs = require('fs-extra');

const prepareStringForSql = (str) => {
  if(!str) return '';
  let tmp = '';
  if(typeof str === 'object') {
    let tmp2 =  JSON.stringify(str);
    tmp2 = tmp2.replace(/'/g, "''");
    return tmp2;
  }
    tmp = str.toString();
    tmp = tmp.replace(/'/g, "''");
    // remove carriage returns
    tmp = tmp.replace(/\r/g, ' ');
    // remove newlines
    tmp = tmp.replace(/\n/g, ' ');
    // remove tabs
    tmp = tmp.replace(/\t/g, ' ');
    return tmp;
  }

  const getTimestamp = () => {
    let dt = new Date();
    let dtYear = dt.getFullYear();
    let dtMonth = String(dt.getMonth() + 1).padStart(2, '0');
    let dtDay = String(dt.getDate()).padStart(2, '0');
    let dtHour = String(dt.getHours()).padStart(2, '0');
    let dtMinute = String(dt.getMinutes()).padStart(2, '0');
    let dtSecond = '00';
    let insert_date = `${dtYear}-${dtMonth}-${dtDay} ${dtHour}:${dtMinute}:${dtSecond}`;
    return insert_date;
  }
  
  const getTimestampSuffix = () => {
    let dt = new Date();
    let dtYear = dt.getFullYear();
    let dtMonth = String(dt.getMonth() + 1).padStart(2, '0');
    let dtDay = String(dt.getDate()).padStart(2, '0');
    let dtHour = String(dt.getHours()).padStart(2, '0');
    let dtMinute = String(dt.getMinutes()).padStart(2, '0');
    let insert_date = `${dtYear}${dtMonth}${dtDay}${dtHour}${dtMinute}`;
    return insert_date;
  }
  
    module.exports = { prepareStringForSql, getTimestamp, getTimestampSuffix };