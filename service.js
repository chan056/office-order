var PORT = 3456;

var http = require('http');
var url = require('url');
var fs = require('fs');
var mine = require('./mine').types;
var path = require('path');

var server = http.createServer(function (request, response) {
    var pathname = url.parse(request.url).pathname;
    if (pathname.charAt(pathname.length - 1) == "/") {
        //如果访问目录
        pathname += "index.html"; //指定为默认网页
    }
    // var realPath = pathname;
    var realPath = path.join("./", pathname);
    // console.log(realPath);
    var ext = path.extname(realPath);
    if(ext){
        ext = ext ? ext.slice(1) : 'unknown';
        fs.exists(realPath, function (exists) {
            if (!exists) {
                response.writeHead(404, {
                    'Content-Type': 'text/plain'
                });
    
                response.write("This request URL " + pathname + " was not found on this server.");
                response.end();
            } else {
                fs.readFile(realPath, "binary", function (err, file) {
                    if (err) {
                        response.writeHead(500, {
                            'Content-Type': 'text/plain'
                        });
                        console.log(err);
                        response.end(err+"");
                    } else {
                        var contentType = mine[ext] || "text/plain";
                        response.writeHead(200, {
                            'Content-Type': contentType
                        });
                        response.write(file, "binary");
                        response.end();
                    }
                });
            }
        });
    }else{
        let connection = connect();
        let urlObj = require('url').parse(request.url, true);
        let query = urlObj.query;

        // 检查用户是否登录
        const cookie = require('cookie');
        var cookies = cookie.parse(request.headers.cookie || '');
        var sid = cookies.sid;

        if(urlObj.pathname == '/orders'){
            let sql = `select * from \`order\` where startTime > ${+new Date()} and roomId=${query.roomId} order by startTime`;
            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);
                    
               response.end(JSON.stringify(list));
            })
        }else if(pathname == '/order'){
            if(sid){
                let sql = `INSERT INTO \`order\` (startTime, endTime, userId, roomId) VALUES ('${query.startTime}', '${query.endTime}', ${sid}, ${query.roomId})`

                connection.query(sql, function (err, list, fields) {
                    if(err)
                        console.log(err);
    
                   response.end();
                })
            }/* else{
                response.statusCode = 400;
                response.end()
            } */
        }else if(pathname == '/cancelOrder'){
            if(sid){
                let sql = `delete from \`order\` where id=${query.orderId}`

                connection.query(sql, function (err, list, fields) {
                    if(err)
                        console.log(err);
    
                        console.log(arguments)
                   response.end();
                })
            }
        }else if(pathname == '/regist'){
            let sql = `INSERT INTO \`user\` (name) VALUES ('${query.name}')`

            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);

               response.end();
            })
        }else if(pathname == '/login'){
            let sql = `select * from \`user\` where name='${query.name}'`

            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);

                if(list.length){
                    response.setHeader('Set-Cookie', cookie.serialize('sid', String(list[0].id), {
                        httpOnly: true,
                        maxAge: 60 * 60 * 24
                    }));

                    response.end('1');
                }else{
                    response.end('0');
                }
            })
        }else if(pathname == '/checkLogin'){
            if(sid){
                var sql = `select name from \`user\` where id=${sid}`;
                connection.query(sql, function (err, list, fields) {
                    if(err)
                        console.log(err);

                    response.end(JSON.stringify(list[0].name))
                })
            }
        }else if(pathname == '/checkIfOwnOrder'){
            if(sid){
                var sql = `select * from \`order\` where id=${query.orderId} and userId=${sid}`;
                connection.query(sql, function (err, list, fields) {
                    if(err)
                        console.log(err);

                    if(list.length){
                        response.end('1')
                    }else{
                        response.end('0')
                    }
                })
            }
        }else if(pathname == '/rooms'){
            let sql = `select * from \`room\``;
            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);
                    
                response.end(JSON.stringify(list));
            })
        }
    }
});
server.listen(PORT);
console.log("Server runing at port: " + PORT + ".");


// =================
// CONNECT
function connect(){
    const mysql = require('mysql');
    let dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '62191056',
        database: 'office',
        multipleStatements: true
    };

    return handleDisconnect();

    function handleDisconnect() {
        var connection = mysql.createConnection(dbConfig); 

        connection.connect(function (err) {
            if (err) {
                console.log('error when connecting to db:', err);
                setTimeout(handleDisconnect, 2000);
            }
        });

        connection.on('error', function (err) {
            console.log('db error', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                handleDisconnect();
            } else { 
                throw err;                                  
            }
        });

        return connection;
    }
}