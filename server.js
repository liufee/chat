var io = require("socket.io")(5000);

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

var onlineUsers = {};//在线用户
var onlineCount = 0;//在线用户人数
var userSockets = {};

io.on('connection', function(socket){
	console.log("a user connected");
	socket.on('login', function(data){
		if(!onlineUsers.hasOwnProperty(data.username)){
			socket.name = data.username;
			onlineUsers[data.username] = data;
			userSockets[data.username] = socket;
			onlineCount++;
		}
		collection.find().sort({_id:-1}).limit(15).toArray(function(err,chatList){
			if(err) console.log(err);
       		socket.emit('initChat', {chatList:chatList});
       	}); 
		io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:data});
		console.log(data.username+'加入了聊天室');
	});
	socket.on('message', function(data){
		var dt = new Date();
		var time = (dt.getFullYear())+'-'+(parseInt(dt.getMonth())+1)+'-'+(dt.getDate())+' '+(dt.getHours())+':'+(dt.getMinutes())+':'+(dt.getSeconds());
		data.time = time;
		var dt = {username:data.username,content:data.content,time:data.time};
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
		userSockets[data.toWhom].emit('privateChat', data);
		userSockets[data.username].emit('privateChat', data);
		console.log(data.username+"对"+data.toWhom+"说 "+data.content);
	})
});
