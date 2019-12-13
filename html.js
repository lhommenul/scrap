const fs = require ('fs');
const axios = require('axios');
fs.readFile('./data.txt','utf-8',(err,data)=>{
    var a = new dataFilter(data);
    var o = a.getId('u_0_k u_0_l u_0_m creation_hub_entrypoint');
    console.log(o);
    
})

class dataFilter{
    constructor(data){
        var comments = this.foundComments(data);
        var script = this.foundScript(data,comments);
        var style = this.foundStyle(data,comments);
        var position_closing_tag = this.foundClosingOpeningTag(data,script,style,comments);
        fs.writeFile('d.txt',JSON.stringify(position_closing_tag.search),(err)=>{})
        var family = this.familyCreator(position_closing_tag.data);
        var children = this.foundChildren(family);
        this.propo = position_closing_tag.search;
        this.containers_data = position_closing_tag.data;
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
                // Create an array of every single tag_name founded 
                for (let index = 0; index < position[position.length-1].data_founded.length; index++) {
                    const element = position[position.length-1].data_founded[index];                                        
                    // console.log(params_name);
                    if (params_name[element.name] != undefined) {
                        params_name[element.name].push(position[position.length-1])
                    }else{
                        params_name[element.name] = [];
                        params_name[element.name].push(position[position.length-1])
                    }
                }                      
            }
            last = end;
        }
        console.log(i);
        
        return {data:position,search:params_name};
    }
    familyCreator(all_tags){
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
    foundChildren(data){
        var container = []
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
                    }else{
                        if (container[position] != undefined) {
                            container[position].open.push(o)                            
                        }                        
                    }
                }                
            }   
        }
        // Create Couple
        var c = []
        for (let index = 0; index < container.length; index++) {
            const couples = container[index];
            if (couples != undefined) {
                c[index] = [];
                while (couples.open != 0|| couples.close != 0) {
                    var s = couples.open[couples.open.length-1], e = couples.close[0];
                    if (e != undefined) c[index].push({start:s,end:e});
                    couples.open.pop()
                    couples.close.shift()                    
                }
            }
        }
        return c;
    }
    getParams(param_name_searched = String){
        var result = null;                
        if (this.propo[param_name_searched] != undefined) {
            result = this.propo[param_name_searched]
        }
        return result;
    }
    getClass(class_name_searched = String){
        var container = []
        for (let index = 0; index < this.propo['class'].length; index++) {
            for (let compteur = 0; compteur < this.propo['class'][index].data_founded.length; compteur++) {
                const element = this.propo['class'][index].data_founded[compteur];
                if (element.name == 'class') {
                    // filter the data  
                    if (element.data.indexOf('"') != -1) {
                        element.data = element.data.replace(/"/g,'');
                        element.data = element.data.replace(/>/g,'');
                    }
                    if (element.data == class_name_searched) {
                        container.push(this.propo['class'][index]);
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
            for (let compteur = 0; compteur < this.containers_data.length; compteur++) {
                if (this.containers_data[compteur].name == j) {
                    if (container[j] ==  undefined) {
                        container[j] = []
                        container[j].push(this.containers_data[compteur])
                    } else {
                        container[j].push(this.containers_data[compteur])
                    }   
                }
            }   
        }
        return container;
    }
}
