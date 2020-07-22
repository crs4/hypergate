console.log(process.argv[2]);
console.error('err1');
const jsonfile = require('jsonfile');
jsonfile.readFile('temp.json', (error, data) => {
    if (error) {
        console.error(error);
        process.exit(1);
    }
    //data.messages = [{ code: 'OK', message: 'hi'}];
    data.val1 = data.param1;
    
    data.val2 = process.argv[2];
    data.val3 = 3;
    //data.messages.push({ code: 'OK', message: 'bye'});
    jsonfile.writeFileSync('temp.json', data);
    //process.exit(33);
});
