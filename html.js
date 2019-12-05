const fs = require ('fs');
fs.readFile('./data.txt','utf-8',(err,data)=>{
    new dataFilter(data)
})

class dataFilter{
    constructor(data){
        var position_closing_tag = this.foundClosingTag(data,this.foundScript(data),this.foundStyle(data))
    }
    foundScript(data){
        var last = 0, position = [];
        while (data.indexOf('<script',last) != -1) {
            var start = data.indexOf('<script',last), end = data.indexOf('>',start),start_end = data.indexOf('</script',end),end_end = data.indexOf('>',start_end), sliced = data.slice(start,end_end+1);
            position.push({
                open:start,
                close:end_end+1,
                data:sliced
            })
            last = end
        }
        return position;
    }
    foundStyle(data){
        var last = 0, position = [];
        while (data.indexOf('<style',last) != -1) {
            var start = data.indexOf('<style',last), end = data.indexOf('>',start),start_end = data.indexOf('</style',end),end_end = data.indexOf('>',start_end), sliced = data.slice(start,end_end+1);
            position.push({
                open:start,
                close:end_end+1,
                data:sliced
            })
            last = end;
        }
        return position;
    }
    foundClosingTag(data,exclude_script,exclude_style){
        var last = 0,position = [];
        // TO UPDATE 
            // if start or data are equal to start or data or even beetwen those data the they are not opening deffrent from style or script tags
                // ELSE create nex data
        while (data.indexOf('<',last) != -1) {
            var start = data.indexOf('<',last), end = data.indexOf('>',start), sliced = data.slice(start,end+1);
            //=====> script exclude
            var start = 0;         
            position.push({
                open:start,
                close:end,
                data:sliced
            })
            last = end;
        }
        return position;
    }
}
