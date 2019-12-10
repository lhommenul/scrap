const fs = require ('fs');
fs.readFile('./data.txt','utf-8',(err,data)=>{
    new dataFilter(data)
})

class dataFilter{
    constructor(data){
        var comments = this.foundComments(data)
        var script = this.foundScript(data,comments);
        var style = this.foundStyle(data,comments);
        var position_closing_tag = this.foundClosingOpeningTag(data,script,style,comments);
        var family = this.familyCreator(position_closing_tag);
        var children = this.foundChildren(family);
        fs.writeFile('res.txt',JSON.stringify(position_closing_tag),(err)=>{})
        fs.writeFile('family.txt',JSON.stringify(family),(err)=>{})
        fs.writeFile('children.txt',JSON.stringify(children),(err)=>{})
        // console.log(position_closing_tag);
        
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
        var last = 0,position = [];
        // TO UPDATE 
            // if start or data are equal to start or data or even beetwen those data the they are not opening deffrent from style or script tags
                // ELSE create nex data
        while (data.indexOf('<',last) != -1) {
            var start = data.indexOf('<',last), end = data.indexOf('>',start), sliced = data.slice(start,end+1), equal = false;
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
            // exclude_comments
            for (let index = 0; index < exclude_comments.length; index++) {
                var element = exclude_comments[index].data;
                for (let index = 0; index < exclude_comments.length; index++) {
                    var element = exclude_comments[index].data;
                    element = element.slice(4,element.length-4);
                    if (element == sliced) equal = true;
                }
                if (start >= exclude_comments[index].open &&  end <= exclude_comments[index].close) {                                        
                    equal = true;   
                }
            }                
            //=====> script exclude
            if (equal == false) {
                var closing = false, self_closing = false, data_founded = {};
                // closing ?
                if (sliced.slice(1,2) == '/') closing = true;
                // self closing ?
                var size = sliced.length;
                if (sliced.slice(size-2,size-1) == '/' || sliced.slice(1,2) == '!') self_closing = true;
                function foundName(c) {                    
                    var slice = sliced.split(' '), po = 1;
                    if (c == true) po = 2;
                    var name = slice[0].slice(po,slice[0].length), to_delte = 0;
                    if (name.slice(name.length-1,name.length) == '>') name = name.slice(0,name.length-1)
                    return name;
                }
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
                    self_closing:self_closing,
                    data:sliced,
                    data_founded:foundData(sliced)
                })                                
            }
            last = end;
        }
        return position;
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
        fs.writeFile('resultat.txt',JSON.stringify(container),(err)=>{})
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
}
