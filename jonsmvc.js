/************************************

Example usage:

var Person = Model({name:'Jon',age:21,weight:150,talk:function(){window.alert('my name is '+this.name())}});
	
var Jon = new Person();
for(k in Jon) console.log(k);
//console.log(Jon);

var PersonView = ModelView({
	className:'PersonView',
	container:'div',
	render: '<div style="color:green;">#name#</div><div style="color:blue">#age#</div>'
});

var JonView = new PersonView({parent:document.body,model:Jon});

var temp = new Collection();
for(var i=0 ; i<10 ; i++){
	temp.add(new Person());
}
console.log(temp.collection);

var PCView = new CollectionView({
	collection:temp,
	model:Person,
	modelView:PersonView,
	container:'div',
	parent:document.body
});

console.log(PCView);

document.getElementById('button').onclick = function(){
	temp.each(function(e){
		e.age(e.age()+1);
	});
}

**************************************/



var Model = function(o){
	var r = function(o){
		this.binds = [];
		for(k in o){
			this[k](o[k]);
		}
	}
	r.prototype.addBind = function(b){
		this.binds.push(b);
	}
	for(k in o){
		if(typeof o[k] == 'function'){
			r.prototype[k] = o[k];
		}else{
			r.prototype['private'+k] = o[k];
			r.prototype[k] = (function(s){
				return function(v){
					if(v){
						this['private'+s] = v;
						for(var i=0 ; i<this.binds.length ; i++){
							this.binds[i].render();
						}
					}
					return this['private'+s];
				}
			})(k);
			if(o[k] instanceof Array){
				r.prototype[k+'Push'] = (function(s){
					return function(v){
						this['private'+s].push(v);
						for(var i=0 ; i<this.binds.length ; i++){
							this.binds[i].render();
						}
					}
				})(k);
				r.prototype[k+'Pop'] = (function(s){
					return function(){
						this['private'+s].pop();
						for(var i=0 ; i<this.binds.length ; i++){
							this.binds[i].render();
						}
					}
				})(k);
				r.prototype[k+'Splice'] = (function(s){
					return function(v,c){
						this['private'+s].splice(v,c);
						for(var i=0 ; i<this.binds.length ; i++){
							this.binds[i].render();
						}
					}
				})(k);
			}
		}
	}
	return r;
}

var Collection = function(m){
	this.binds = [];
	this.collection = [];
}

Collection.prototype.add = function(m){
	this.collection.push(m);
	for(var i=0 ; i<this.binds.length ; i++){
		this.binds[i].render();
	}
}
Collection.prototype.remove = function(m){
	for(var i=0 ; i<this.collection.length ; i++){
		if(m == this.collection[i]){
			this.collection.splice(i,1);
			for(var i=0 ; i<this.binds.length ; i++){
				this.binds[i].render();
			}
			return true;
		}
	}
	for(var i=0 ; i<this.binds.length ; i++){
		this.binds[i].render();
	}
	return false;
}
Collection.prototype.removeByIndex = function(m){
	this.collection.splice(i,1);
	for(var i=0 ; i<this.binds.length ; i++){
		this.binds[i].render();
	}
}
Collection.prototype.addBind = function(b){
	this.binds.push(b);
}
Collection.prototype.each = function(f){
	for(var i=0 ; i<this.collection.length ; i++){
		f(this.collection[i]);
	}
}

var ModelView = function(o /*{className,container,render*/){
	var r = function(o2){
		this.parent = o2.parent;
		this.model = o2.model;
		this.container = o.container;
		this.el = document.createElement(this.container);
		this.el.className = o.className;
		this.parent.appendChild(this.el);
		this.model.addBind(this);
		this.renderString = o.render;
		this.render();
	}
	var s = o.render.replace(/\"/g,'\'');
	var f = ['"'];
	var regx = /.*?(#(\S*?)#)?(<.*?>)?(.*?(\?(\S*?)\?).*?)?(<\/.*?>)?/;
	//console.log(o);
	while(s.length > 0){
		var result = regx.exec(s);
		//console.log(result);
		if(result == null){
			f.push(s);
			break;
		}
		s = s.substr(result[0].length);
		console.log(result);
		f.push(result[0].replace('#'+result[2]+'#','"+this.model.private'+result[2]+'+"').replace(
			'?'+result[6]+'?','"+this.model.private'+result[6]+'.join("'+result[3]+result[7]+'")+"'));
		console.log('f: '+f.join(''));
		//console.log(result);
		//console.log(s);
	}
	f.push('"');
	var f = f.join('');
	console.log(f);
	r.prototype.render = new Function('this.el.innerHTML = '+f);
	return r;
}

var CollectionView = function(o){
	this.collection = o.collection;
	this.model = o.model;
	this.modelView = o.modelView;
	this.container = o.container;
	this.collection.addBind(this);
	this.parent = o.parent;
	this.el = document.createElement(this.container);
	this.parent.appendChild(this.el);
	this.render();
	this.views = [];
}

CollectionView.prototype.render = function(){
	this.el.innerHTML = '';
	this.views = [];
	for(var i=0 ; i<this.collection.collection.length ; i++){
		this.views.push(new this.modelView({parent:this.el,model:this.collection.collection[i]}));
		this.views[i].render();
	}
}