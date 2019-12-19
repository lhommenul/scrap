const fs = require ('fs');
const axios = require('axios');
fs.readFile('./data.txt','utf-8',(err,data)=>{
    var a = new dataFilter(data);
    var i = a.getTagName('div')
    console.log(i);    
})

class dataFilter{
    constructor(data){
        // DETECTION => STYLE, SCRIPTS, COMMENTS tags ... 
        var comments = this.foundComments(data);
        var script = this.foundScript(data,comments);
        var style = this.foundStyle(data,comments);
        // DETECTION => OPEN, SELF_CLOSING, CLOSING tags ... 
        var position_closing_tag = this.foundClosingOpeningTag(data,script,style,comments);
        // LIST OF ALL TAGS-NAMES AND ONE ARRAY OF ALL TAGS-NAMES WITH ALL OBJECTS ASSOCIETED TO INSIDE
        var family = this.familyCreator(position_closing_tag);
        var children = this.foundChildren(family,data);        
        this.childrens = children;
        
    }
    foundComments(data){
        var last = 0, position = [];
        while (data.indexOf('<!--',last) != -1) {
            var start = data.indexOf('<!--',last), end_end = data.indexOf('-->',start), sliced = data.slice(start,end_end+3);
            position.push({
                open:start,
                close:end_end+3,
                data:sliced
            })
            last = end_end
        }
        return position;        
    }
    foundScript(data,comments){
        var last = 0, position = [];
        while (data.indexOf('<script',last) != -1) {
            var start = data.indexOf('<script',last), end = data.indexOf('>',start),start_end = data.indexOf('</script',end),end_end = data.indexOf('>',start_end), sliced = data.slice(start,end_end+1), ok = true;
            for (let index = 0; index < comments.length; index++) {
                const element = comments[index].data;
                var size = element.length;
                if (sliced == element.slice(4,size-4)) {
                    ok = false;
                }
            }
            if (ok == true) {                
                position.push({
                    open:start,
                    close:end_end+1,
                    data:sliced
                })                
            }
            last = end
        }
        return position;
    }
    foundStyle(data,comments){
        var last = 0, position = [];
        while (data.indexOf('<style',last) != -1) {
            var start = data.indexOf('<style',last), end = data.indexOf('>',start),start_end = data.indexOf('</style',end),end_end = data.indexOf('>',start_end), sliced = data.slice(start,end_end+1), ok = true;
            for (let index = 0; index < comments.length; index++) {
                const element = comments[index].data;
                var size = element.length;
                if (sliced == element.slice(4,size-4)) {
                    ok = false;
                }
            }
            if (ok == true) {
                position.push({
                    open:start,
                    close:end_end+1,
                    data:sliced
                })                
            }
            last = end;
        }
        return position;
    }
    foundClosingOpeningTag(data,exclude_script,exclude_style,exclude_comments){
        var last = 0,position = [], params_name = {};
        // TO UPDATE 
            // if start or data are equal to start or data or even beetwen those data the they are not opening deffrent from style or script tags
                // ELSE create nex data
                var i = 0;
        while (data.indexOf('<',last) != -1) {
            var start = data.indexOf('<',last), end = data.indexOf('>',start), sliced = data.slice(start,end+1), equal = false, commented = false;
            // exclude_script
            for (let index = 0; index < exclude_script.length; index++) {
                var element = exclude_script[index].data;
                if (element.indexOf('</script>') != -1) element = element.slice(0,element.indexOf('</script>'));
                if (element == sliced) equal = true;
            }
            // exclude_style
            for (let index = 0; index < exclude_style.length; index++) {
                var element = exclude_style[index].data;
                for (let index = 0; index < exclude_style.length; index++) {
                    var element = exclude_style[index].data;
                    if (element.indexOf('</style>') != -1) element = element.slice(0,element.indexOf('</style>'));
                    if (element == sliced) equal = true;
                }
                if (element == sliced) {
                    equal = true;   
                }
            }         
            if(sliced.indexOf('div') != -1 && equal == false){i++}
            // exclude_comments
            // PROBLEME => NEED TO EXTRACT FROM COMMENTS THE TAGS
            for (let index = 0; index < exclude_comments.length; index++) {
                var element = exclude_comments[index].data;
                if (start >= exclude_comments[index].open &&  end <= exclude_comments[index].close) {  
                    commented = true;                                      
                    // equal = true;   
                }
            }                
            // if(sliced.indexOf('div') != -1 && equal == false){i++}
            //=====> script exclude
            if (equal == false) {
                var closing = false, self_closing = false;
                // closing ?
                if (sliced.slice(1,2) == '/') closing = true;
                // self closing ?
                var size = sliced.length;
                if (sliced.slice(size-2,size-1) == '/' || sliced.slice(1,2) == '!') self_closing = true;
                // found the name of the tag
                function foundName(c) {                    
                    var slice = sliced.split(' '), po = 1;
                    if (c == true) po = 2;
                    var name = slice[0].slice(po,slice[0].length), to_delte = 0;
                    if (name.slice(name.length-1,name.length) == '>') name = name.slice(0,name.length-1)
                    return name;
                }
                // found data inside a tag
                function foundData(data) {
                    var splitted = data.split(' '), slice = data.slice(), u = [];
                    for (let index = 0; index < splitted.length; index++) {
                        const element = splitted[index];
                        var i = element.indexOf('=');
                        if (i != -1) {
                            var variable_name = element.slice(0,i);
                            var variable_data = element.slice(i+1,element.length)
                            u.push({name:variable_name,data:variable_data})
                        }
                    }
                    return u;
                }
                position.push({
                    open:start,
                    close:end,
                    closing_tag:closing,
                    name:foundName(closing),
                    commented:commented,
                    self_closing:self_closing,
                    data:sliced,
                    data_founded:foundData(sliced)
                })                               
            }
            last = end;
        }
        // add script ; style ; comments;
        position.push(exclude_style)
        position.push(exclude_script)
        position.push(exclude_comments)
        return position;
    }
    familyCreator(all_tags){
        // list of every single tags_name founded in the document
        var obj = {name:[],elements:{}}
        for (let index = 0; index < all_tags.length; index++) {
            const element = all_tags[index].name;
            if (obj.elements[element] == undefined) {
                obj.elements[element] = []
                obj.name.push(element);
                obj.elements[element].push(all_tags[index]);
            }else{
                obj.elements[element].push(all_tags[index]);
            }
        }
        return obj
    }
    foundChildren(data,stat){
        var container = [], self_closing = {name:[],elements:{}}
        for (let position = 0; position < data.name.length; position++) {
            const element = data.name[position];
            for (let index = 0; index < data.elements[element].length; index++) {
                const o = data.elements[element][index];
                if (o.self_closing != true) {
                    if (index == 0) {
                        container[position] = {open:[],close:[]}
                    }
                    if (o.closing_tag == true) {
                        if (container[position] != undefined) {
                            container[position].close.push(o)                            
                        }
                    }else if(container[position] != undefined){
                        container[position].open.push(o);
                    }
                }else{
                    if (self_closing.elements[o.name] != undefined) {
                        self_closing.elements[o.name].push(o)
                    }else{
                        self_closing.elements[o.name] = []
                        self_closing.name.push(o.name)
                        self_closing.elements[o.name].push(o)
                    }
                }                
            }   
        }
        data.elements = {}
        // Create Couple
        var c = []
        for (let index = 0; index < container.length; index++) {
            var couples = container[index];
            if (couples != undefined) {
                c[index] = [];
                while (couples.open != 0|| couples.close != 0) {
                    var s = couples.open[0], e = couples.close[0];
                    if (e != undefined && s != undefined) { 
                        c[index].push(                            
                            {
                                start:s.open,
                                end:e.close,
                                commented:e.commented,
                                data_founded:s.data_founded,
                                name:couples.close[0].name,
                                data:stat.slice(s.close+1,e.open)
                            }
                        )
                        if (data.elements[couples.close[0].name] == undefined) {
                            data.elements[couples.close[0].name] = [];
                            data.elements[couples.close[0].name].push(c[index]);
                        }else{
                            data.elements[couples.close[0].name].push({
                                start:s.open,
                                end:e.close,
                                commented:e.commented,
                                data_founded:s.data_founded,
                                name:couples.close[0].name,
                                data:stat.slice(s.close+1,e.open)
                            })
                        }
                    }
                    couples.open.shift()
                    couples.close.shift()                    
                }
            }
        }        
        // Push all self_closing tags into the list                                                                                        
        for (let index = 0; index < self_closing.name.length; index++) {
            const element = self_closing.name[index];
            if (data.name[element.name] == undefined) data.elements[element.name] = self_closing.elements[element.name];
        }        
        return data.elements;
    }
    getParams(param_name_searched = String){
        var result = null, split = param_name_searched.split(' ');
        for (let index = 0; index < split.length; index++) {
            if (this.propo[split[index]] != undefined) {
                result = this.propo[split[index]]
            }            
        }
        return result;
    }
    getClass(class_name_searched = String){
        var container = [], split = class_name_searched.split(' ');
        for (let l = 0; l < split.length; l++) {
            for (let index = 0; index < this.propo['class'].length; index++) {
                for (let compteur = 0; compteur < this.propo['class'][index].data_founded.length; compteur++) {
                    const element = this.propo['class'][index].data_founded[compteur];
                    if (element.name == 'class') {
                        // filter the data  
                        if (element.data.indexOf('"') != -1) {
                            element.data = element.data.replace(/"/g,'');
                            element.data = element.data.replace(/>/g,'');
                        }
                        if (element.data == split[l]) {
                            container.push(this.propo['class'][index]);
                        }
                        
                    }
                       
                }
                
            }
        }
        return container;
    }
    getId(id_name_searched = String){
        var container = [], sli = id_name_searched.split(' ');
        for (let index = 0; index < sli.length; index++) {
            const j = sli[index];
            for (let index = 0; index < this.propo['id'].length; index++) {
                for (let compteur = 0; compteur < this.propo['id'][index].data_founded.length; compteur++) {
                    const element = this.propo['id'][index].data_founded[compteur];
                    if (element.name == 'id') {
                        // filter the data  
                        
                        if (element.data.indexOf('"') != -1) {
                            element.data = element.data.replace(/"/g,'');
                            element.data = element.data.replace(/>/g,'');
                        }      
                        if (element.data == j) {                            
                            if (container[j] == undefined) {
                                container[j] = [];
                                container[j].push(this.propo['id'][index])
                            }else{
                                container[j].push(this.propo['id'][index])
                            }
                        }
                    }
                       
                }
                
            }   
        }
        return container;
    }
    getTagName(tag_name_searched = String){
        var container = [], sli = tag_name_searched.split(' ');
        for (let index = 0; index < sli.length; index++) {
            const j = sli[index];
            if (this.childrens[j] != undefined) {
                container.push(this.childrens[j])
            }   
        }
        return container;
    }
}
