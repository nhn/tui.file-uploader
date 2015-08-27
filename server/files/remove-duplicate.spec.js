var removeDuplicate = require('./remove-duplicate');

var result1 = removeDuplicate([1,3,3,3,1,5,6,7,8,1]);
var result2 = removeDuplicate([1,1,1,1,1,1,1,1,1,1,1]);
console.log('[1,3,3,3,1,5,6,7,8,1] => ' , result1);
console.log('[1,1,1,1,1,1,1,1,1,1,1] => ' , result2);
