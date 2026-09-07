import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const args=process.argv.slice(2);
const value=(flag,fallback)=>{const i=args.indexOf(flag);return i>=0&&args[i+1]?args[i+1]:fallback};
const port=Number(value('--port','4173'));
const host=value('--host','0.0.0.0');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};

createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  const safe=normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[/\\]+/,'');
  let file=join(process.cwd(),safe||'index.html');
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)){res.writeHead(404);res.end('Not found');return}
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  createReadStream(file).pipe(res);
}).listen(port,host,()=>console.log(`Super Evidence preview: http://${host}:${port}`));
