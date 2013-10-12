function APIElem(name,path,type,version,attr) {
	this.name = name;
	this.fullName = path + '/' + name;
	this.type = type;
	this.version = version;
	this.attr = attr;
}
