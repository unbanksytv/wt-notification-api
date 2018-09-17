const bodyParser = require('body-parser');
const express = require('express');

const app = express();

app.use(bodyParser.json());

app.post('*', (req, res) => {
  console.log('Got a notification:');
  console.log(req.body);
  res.status(200).send('notification accepted');
});

const PORT = 7777;
app.listen(PORT, () => {
  console.log(`Dummy consumer at ${PORT}...`);
});
