var io = require("socket.io")(5000);
var request = require("request");

var  mongodb = require('mongodb');
var  server  = new mongodb.Server('localhost', 27017, {auto_reconnect:true});
var  db = new mongodb.Db('feehi', server, {safe:true});
var collection;
//连接db
db.open(function(err, db){
    if(err) console.log(err);
    console.log('connect mongodb success');
    // 第1种连接方式
    db.collection('chat',{safe:true}, function(err, collect){
        if(err){
            console.log(err);
        }
        collection = collect;
	});
	
})
//db.createCollection('mycoll', {safe:true}, function(err, collection){})第二种连接

var onlineUsers = {"机器人":{"username":"机器人"},"机器人2号":{"username":"机器人2号"},"机器人3号":{"username":"机器人3号"}};//在线用户
var onlineCount = 2;//在线用户人数
var userSockets = {};

io.on('connection', function(socket){
	console.log("a user connected");
	socket.on('login', function(data){
		if(!onlineUsers.hasOwnProperty(data.username)){
			socket.name = data.username;
			onlineUsers[data.username] = data;
			userSockets[data.username] = socket;
			onlineCount++;
			collection.find().sort({_id:-1}).limit(15).toArray(function(err,chatList){
				if(err) console.log(err);
	       		socket.emit('initChat', {chatList:chatList});
	       	}); 
			io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:data});
			console.log(data.username+'加入了聊天室');
		}else{
			socket.emit('login', {err:1, err_msg:"用户名已经存在，请换个用户名"});
		}
		
	});
	socket.on('message', function(data){
		var dt = new Date();
		var time = (dt.getFullYear())+'-'+(parseInt(dt.getMonth())+1)+'-'+(dt.getDate())+' '+(dt.getHours())+':'+(dt.getMinutes())+':'+(dt.getSeconds());
		data.time = time;
		var dt = {username:data.username,content:data.content.replace(/</g, "&lt;").replace(/>/g, "&gt;"),time:data.time};
	 	io.emit('message', dt);
        collection.insert(dt, {safe:true},function(err, result){
            //console.log(result);
        }); 
	 	console.log(dt.username+'说: '+dt.content);
	});
	socket.on('disconnect', function(){
		if(onlineUsers.hasOwnProperty(socket.name)){
			var logoutUser = socket.name;
			console.log(socket.name+'退出了聊天室');
			delete onlineUsers[socket.name];
			delete userSockets[socket.name];
			onlineCount--;
			io.emit('logout', {logoutUser:logoutUser,onlineCount:onlineCount});
		}
	})
	socket.on('privateChat', function(data){
		var dt = new Date();
		var time = (dt.getFullYear())+'-'+(parseInt(dt.getMonth())+1)+'-'+(dt.getDate())+' '+(dt.getHours())+':'+(dt.getMinutes())+':'+(dt.getSeconds());
		data.time = time;
		if( data.toWhom == '机器人' ){
			userSockets[data.username].emit('privateChat', data);
			var temp = {};
			temp.toWhom = data.username;
			temp.username = data.toWhom;
			temp.time = time;
			var text = data.content;

			request.post(
			{
				url:'http://i.itpk.cn/api.php?question='+text,
				headers:{
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:43.0) Gecko/20100101 Firefox/43.0'
				},
				form:{
					'text':text
				},
				encoding:'utf8'
			},
			function(err, response, body){
				if(err) console.log(err);
				temp.content = body;
				userSockets[data.username].emit('privateChat', temp);
				//console.log(response);
			}
			)

		}else if( data.toWhom == '机器人2号' ){
			userSockets[data.username].emit('privateChat', data);
			var temp = {};
			temp.toWhom = data.username;
			temp.username = data.toWhom;
			temp.time = time;
			var text = data.content;

			request.post(
			{
				url:'http://www.tuling123.com/openapi/api?key=f3e1da0922c70bd57a1b30c4a72ebd46&info='+text,
				headers:{
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:43.0) Gecko/20100101 Firefox/43.0'
				},
				form:{
					'text':text
				},
				encoding:'utf8'
			},
			function(err, response, body){
				if(err) console.log(err);
				var result = eval('(' + body + ')');
				temp.content = result['text'];
				userSockets[data.username].emit('privateChat', temp);
			}
			)
		}else if( data.toWhom == '机器人3号' ){
			userSockets[data.username].emit('privateChat', data);
			var temp = {};
			temp.toWhom = data.username;
			temp.username = data.toWhom;
			temp.time = time;
			var text = data.content;

			request.post(
			{
				url:'http://www.xiaohuangji.com/ajax.php',
				headers:{
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:43.0) Gecko/20100101 Firefox/43.0'
				},
				form:{
					'para':text
				},
				encoding:'utf8'
			},
			function(err, response, body){
				if(err) console.log(err);
				temp.content = body;
				userSockets[data.username].emit('privateChat', temp);
				//console.log(response);
			}
			)
		}else{
			userSockets[data.username].emit('privateChat', data);
			if(userSockets[data.toWhom]){
				userSockets[data.toWhom].emit('privateChat', data);	
			}else{
				data.content = "用户已经掉线了";
				userSockets[data.username].emit('privateChat', data);
			}
		}
		console.log(data.username+"对"+data.toWhom+"说 "+data.content);
	})
});