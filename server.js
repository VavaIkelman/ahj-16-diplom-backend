const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const Router = require('koa-router');
const cors = require('koa2-cors');
const WS = require('ws');
const path = require('path');
const Storage = require('./Storage');


const app = new Koa();
const router = new Router();

// Body Parsers
app.use(koaBody({
  json: true, text: true, urlencoded: true, multipart: true,
}));

// CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// Routers
app.use(router.routes()).use(router.allowedMethods());

// Files Directory
const filesDir = path.join(__dirname, '/files');
app.use(koaStatic(filesDir));

// Starting Server
const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

// DATABASE
const dB = [
  {id: '001', message: 'Белеет парус одинокий в тумане моря голубом', date: Date.now() - 500000000, geo: '', type: 'text'},
  {id: '002', message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam pellentesque massa vitae libero luctus, et luctus orci consequat. Fusce fringilla venenatis dapibus.', date: Date.now() - 450000000, geo: '', type: 'text'},
  {id: '003', message: 'Тanki грязи не боятся', date: Date.now() - 400000000, geo: '', type: 'text'},
  {id: '004', message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam pellentesque massa vitae libero luctus, et luctus orci consequat. Fusce fringilla venenatis dapibus. Praesent eget sagittis augue. Pellentesque ac nunc dolor. Nullam tortor ipsum, laoreet mattis leo et, congue porttitor magna. Aliquam quis elit sem. Integer semper tristique nisl, ac elementum felis accumsan consequat.', date: Date.now() - 400000000, geo: '', type: 'text'},
  {id: '005', message: 'Координаты там и сям', date: Date.now() - 350000000, geo: '55.692493, 37.607834', type: 'text'},
  {id: '006', message: 'Ссылки 1 http://ya.ru 2 https://yandex.ru 3 https://google.com 4 http://vk.com', date: Date.now() - 300000000, geo: '', type: 'text'},
  {id: '007', message: 'magma.jpeg', date: Date.now() - 250000000, geo: '', type: 'image'},
  {id: '008', message: 'cat.mp4', date: Date.now() - 200000000, type: 'video'},
  {id: '009', message: 'frends.mp3', date: Date.now() - 150000000, geo: '59.514793, 28.142395', type: 'audio'},
  {id: '010', message: 'minds_trick.pdf', date: Date.now() - 100000000, geo: '', type: 'file'},
  {id: '011', message: 'Телефончик', date: Date.now(), geo: '', type: 'text'},
  {id: '012', message: 'moto.gif', date: Date.now() - 110000000, geo: '', type: 'image'},
];
const category = {
  links: [
    { name: 'http://ya.ru', messageId: '006' },
    { name: 'https://yandex.ru', messageId: '006' },
    { name: 'https://google.com', messageId: '006' },
    { name: 'http://vk.com', messageId: '006' },
  ],
  image: [
    { name: 'magma.jpg', messageId: '007' },
    { name: 'moto.gif', messageId: '012' },
  ],
  video: [
    { name: 'cat.mp4', messageId: '008' },
  ],
  audio: [
    { name: 'frends.mp3', messageId: '009' },
  ],
  file: [
    { name: 'minds_trick.pdf', messageId: '010' },
  ],
};
const  favourites = new Set(['005', '007', '008', '011']);


const clients = [];
wsServer.on('connection', (ws) => {
  clients.push(ws);
  const storage = new Storage(dB, category, favourites, filesDir, ws, clients);
  storage.init();

  router.post('/upload', async (ctx) => {
    storage.loadFile(ctx.request.files.file, ctx.request.body.geo).then((result) => {
      storage.wsAllSend({ ...result, event: 'file' });
    });
    ctx.response.status = 204;
  });

  ws.on('close', () => {
    const wsIndex = clients.indexOf(ws);
    if (wsIndex !== -1) {
      clients.splice(wsIndex, 1);
    }
  });
});

server.listen(port, () => console.log('Server started'));
