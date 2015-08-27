function removeDuplicate(arr) {
	if(!arr) return;

	var i = 0, len = arr.length, letters = {};
	for(; i < len; i++) {
		letters[arr[i]] = letters[arr[i]] ? letters[arr[i]] + 1 : 1;
	}

	return Object.keys(letters);
}

module.exports = removeDuplicate;
