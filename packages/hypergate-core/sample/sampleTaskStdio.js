process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunck) => {
  let data = JSON.parse(chunck);
  if (data.param1) {
    if (data.param1 === 'ciao') {
      process.stdout.write(`{"val1": "hi", "val2": ${Date.now()}}`);
      return;
    }
  }
  console.error('Bad format');
});

process.stdin.on('end', () => {
  process.exit();
});
 