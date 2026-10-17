import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let file=decodeURIComponent(url.pathname);if(file==='/'||file==='/quantgym/')file='/index.html';else if(file.startsWith('/quantgym/'))file=file.slice(8);const absolute=path.resolve(root,'.'+file);if(!absolute.startsWith(root+path.sep)||file.includes('/.'))throw Error();const data=await readFile(absolute);res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[path.extname(absolute)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));

