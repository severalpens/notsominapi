let dt = new Date();
let dtYear = dt.getFullYear();
let dtMonth = String(dt.getMonth() + 1).padStart(2, '0');
let dtDay = String(dt.getDate()).padStart(2, '0');
let dtHour = String(dt.getHours()).padStart(2, '0');
let dtMinute = String(dt.getMinutes()).padStart(2, '0');
let dtSecond = String(dt.getSeconds()).padStart(2, '0');
let insert_date = `${dtYear}-${dtMonth}-${dtDay} ${dtHour}:${dtMinute}:${dtSecond}`;
console.log(insert_date);