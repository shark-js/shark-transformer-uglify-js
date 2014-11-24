function test() {
	var superLongVariable = 'hello world';
	var superLongFunction = function(superLongArgument) {
		return superLongVariable;
	};

	return superLongFunction();
}