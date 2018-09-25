var PORT = 3456;

var http = require('http');
var url = require('url');
var fs = require('fs');
var mine = require('./mine').types;
var path = require('path');

var server = http.createServer(function (req, res) {
    var pathname = url.parse(req.url).pathname;
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
                res.writeHead(404, {
                    'Content-Type': 'text/plain'
                });
    
                res.write("This req URL " + pathname + " was not found on this server.");
                res.end();
            } else {
                fs.readFile(realPath, "binary", function (err, file) {
                    if (err) {
                        res.writeHead(500, {
                            'Content-Type': 'text/plain'
                        });
                        console.log(err);
                        res.end(err+"");
                    } else {
                        var contentType = mine[ext] || "text/plain";
                        res.writeHead(200, {
                            'Content-Type': contentType
                        });
                        res.write(file, "binary");
                        res.end();
                    }
                });
            }
        });
    }else{
        // 后期这块需要独立
        // 是需要区分请求类型
        let connection = connect();
        let urlObj = require('url').parse(req.url, true);
        let query = urlObj.query;

        // 检查用户是否登录
        const cookie = require('cookie');
        var cookies = cookie.parse(req.headers.cookie || '');
        var sid = cookies.sid;

        if(urlObj.pathname == '/orders'){
            let sql = `SELECT
                o.*,
                u.name
            FROM
                \`order\` o
            INNER JOIN \`user\` u ON o.userId = u.id
            WHERE
                o.startTime >  ${+new Date()}
            AND o.roomId = ${query.roomId} 
            ORDER BY
                o.startTime`;

            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);
                    
               res.end(JSON.stringify(list));
            })
        }else if(pathname == '/order'){
            if(sid){
                let sql = `INSERT INTO \`order\` (startTime, endTime, userId, roomId) VALUES ('${query.startTime}', '${query.endTime}', ${sid}, ${query.roomId})`

                connection.query(sql, function (err, list, fields) {
                    if(err)
                        console.log(err);
    
                   res.end();
                })
            }/* else{
                res.statusCode = 400;
                res.end()
            } */
        }else if(pathname == '/cancelOrder'){
            if(sid){
                let sql = `delete from \`order\` where id=${query.orderId}`

                connection.query(sql, function (err, list, fields) {
                    if(err)
                        console.log(err);
    
                        console.log(arguments)
                   res.end();
                })
            }
        }else if(pathname == '/regist'){
            let sql = `INSERT INTO \`user\` (name) VALUES ('${query.name}')`

            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);

               res.end();
            })
        }else if(pathname == '/login'){
            let sql = `select * from \`user\` where name='${query.name}'`

            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);

                if(list.length){
                    res.setHeader('Set-Cookie', cookie.serialize('sid', String(list[0].id), {
                        httpOnly: true,
                        maxAge: 60 * 60 * 24
                    }));

                    res.end('1');
                }else{
                    res.end('0');
                }
            })
        }else if(pathname == '/checkLogin'){
            if(sid){
                var sql = `select name from \`user\` where id=${sid}`;
                connection.query(sql, function (err, list, fields) {
                    if(err)
                        console.log(err);

                    res.end(JSON.stringify(list[0].name))
                })
            }
        }else if(pathname == '/checkIfOwnOrder'){
            if(sid){
                var sql = `select * from \`order\` where id=${query.orderId} and userId=${sid}`;
                connection.query(sql, function (err, list, fields) {
                    if(err)
                        console.log(err);

                    if(list.length){
                        res.end('1')
                    }else{
                        res.end('0')
                    }
                })
            }
        }else if(pathname == '/rooms'){
            let sql = `select * from \`room\``;
            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);
                    
                res.end(JSON.stringify(list));
            })
        }else if(pathname == '/rooms'){
            let sql = `select * from \`room\``;
            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);
                    
                res.end(JSON.stringify(list));
            })
        }else if(pathname == '/room/delete'){
            let sql = `delete from \`room\` where id=${query.id}`;
            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);
                
                if(list.affectedRows == 1){
                    res.end('1')
                }else{
                    res.end('0')
                }
            })
        }else if(pathname == '/room/add'){
            let sql = `insert into \`room\` (name) values ('${query.name}')`;
            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);
                
                if(list.insertId){
                    res.end('1')
                }else{
                    res.end('0')
                }
            })
        }else if(pathname == '/room/edit'){
            let sql = `update \`room\` set name='${query.name}' where id=${query.id}`;
            connection.query(sql, function (err, list, fields) {
                if(err)
                    console.log(err);
                
                if(list.affectedRows == 1){
                    res.end('1')
                }else{
                    res.end('0')
                }
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
                // setTimeout(handleDisconnect, 2000);
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