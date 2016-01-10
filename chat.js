function Chat(){
	this.socket = ''
	var user = {};
	var config = {
		publicChat : "<div class='row'>"
							+"<div class='user'> <font style='display:block;float:left;' id='color'>[%TIME%]</font>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class='username'>%USERNAME%</span></div><div class='user-content'>  %CONTENT%</div>"
						+"</div>",
		privateChat : "<div class='row'>"
							+"<div class='private-user %SELF%' ><span class='username'>%USERNAME%</span> <font id='color'>[%TIME%]</font></div><div style='margin-left:20px;margin-top:10px;' class='private-user-content %SELFCONTENT%'>  %CONTENT%</div>"
						+"</div>"
	}
	this.listen = function(){
		this.login();
		this.initChat();
		this.logout();
		this.message();
		this.privateChat();
	}
	this.sendLogin = function(u){
		this.socket = io.connect('http://www.feehi.com:5000');
		user = u;
		this.listen();
		this.socket.emit('login', user);
	}
	this.login = function(){
		this.socket.on("login", function(data){
			$("#loading").remove();
			if(data.err){
				alert(data.err_msg);
				$("#login").show();
				return false;
			}
			$("#mask").remove();
			$("#login").remove();
			$("#welcome span").html('欢迎<font color="red">'+data.user.username+'</font>加入聊天室');
			$("#welcome").css({'opacity':1});
			setTimeout(function(){
				$("#welcome").css({"opacity":0});
			} , 5000);
			$("#onlineUserCount").html(data.onlineCount);
			$("#list ul").empty();
			for(var obj in data.onlineUsers){
				var self = '';
				if(user.username == data.onlineUsers[obj].username) self = "active";
				$("#list ul").append('<li username="'+data.onlineUsers[obj].username+'" class="list-group-item '+self+'">'+data.onlineUsers[obj].username+'</li>');
			}
			$("#list ul li").bind('click', function(){
				var who = $(this).attr('username');
				if( $("a[href=#"+who+"]").length>0 ){
					$("a[href=#"+who+"]").tab('show');
					$("button.send").attr('to', who);
				}else{
					$("#chat div ul").append('<li role="presentation"><a href="#'+who+'" aria-controls="profile" role="tab" data-toggle="tab">与'+who+'聊天中</a><button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button></li>');
					$("#chat div.tab-content").append('<div role="tabpanel" class="tab-pane chatlist" id="'+who+'"></div>');
					
					$("a[href=#"+who+"]").bind('click', function(){
						changeChatTo();
					});
					
					$("button.close").bind('click', function(){
						closePrivateChat($(this));
					});
					$("button.send").attr('to', who);
					$("a[href=#"+who+"]").tab('show');
				}
			});
		})
	}
	this.logout = function(){
		this.socket.on("logout", function(data){
			$("#list ul li[username="+data.logoutUser+"]").remove();
			$("#onlineUserCount").html(data.onlineCount);
			
		})
	}
	this.initChat = function(){
		this.socket.on('initChat', function(data){
			var dt = data.chatList;
			var i = dt.length - 1;
			for(i;i>=0;i--){
				var row = config.publicChat.replace(/%USERNAME%/, dt[i]['username']).replace(/%TIME%/, dt[i]['time']).replace(/%CONTENT%/, dt[i]['content']);
				$(".chatlist").eq(0).append(row);
			}
		})
	}
	this.sendMessage = function(content, user){
		if( content.content == '' ) return false;
		var toWhom = $("button.send").attr('to');
		if(typeof(toWhom) == 'undefined'){
			this.socket.emit("message", content);
		}else{
			content.toWhom = toWhom;
			this.socket.emit("privateChat", content);
		}
		$("textarea").val('');
	}
	this.message = function(){
		this.socket.on('message', function(data){
			var self = '';
			var row = config.publicChat.replace(/%USERNAME%/, data['username']).replace(/%TIME%/, data['time']).replace(/%CONTENT%/, data['content']);
			$(".chatlist").eq(0).append(row);
			$("button.send").removeAttr('to');
			var h = $(".chatlist:first").height()+$(".chatlist:first").scrollTop();
			$(".chatlist:first").scrollTop(h);
		})
	}
	this.privateChat = function(){
		this.socket.on('privateChat', function(data){
			var self = '';
			if(data.username == user.username) self =' self';
			var row = config.privateChat.replace(/%USERNAME%/, data['username']).replace(/%TIME%/, data['time']).replace(/%CONTENT%/, data['content']).replace(/%SELF%/, self).replace(/%SELFCONTENT%/, self);
			if(data.username == user.username){//私聊中，自己的信息
				$(".tab-content #"+data.toWhom).append(row);
				var h = $(".tab-content #"+data.toWhom).height()+$(".tab-content #"+data.toWhom).scrollTop();
				$(".tab-content #"+data.toWhom).scrollTop(h);
			}else{//私聊中，对方显示的信息
				if( $(".tab-content #"+data.username).length>0 ){
					$(".tab-content #"+data.username).append(row);
					$("a[href=#"+data.username+"]").tab('show');
					$("button.send").attr('to', data.username);
				}else{
					$("#chat div ul").append('<li role="presentation"><a href="#'+data.username+'" aria-controls="profile" role="tab" data-toggle="tab">与'+data.username+'聊天中</a><button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button></li>');
					$("button.close").bind('click', function(){
						closePrivateChat($(this));
					});
					$("#chat div.tab-content").append('<div role="tabpanel" class="tab-pane chatlist" id="'+data.username+'"></div>');
					$("a[href=#"+data.username+"]").tab('show');
					$("button.send").attr('to', data.username);
					$(".tab-content #"+data.username).append(row);
				}
				var h = $(".tab-content #"+data.username).height()+$(".tab-content #"+data.username).scrollTop();
				$(".tab-content #"+data.username).scrollTop(h);
			}
		})
	}
}

$(document).ready(function(){
	var chat;
	$("body").append("<div id='mask'></div>");
	$("#mask").css({"position":"absolute","top":0,"left":0,"width":$(document).width(),"height":$(document).height(),"background":"black","opacity":0.5});
	$("body").append("<div style='position:absolute;z-index:9999;background:white;width:352px;' id='login'>请输入您的昵称：<input type='text' style='width:186px' name='username'><input class='btn btn-primary' type='button' value='确定'></div>");
	var left = ($(window).width() - $("#login").width())/2;
	var top = ($(window).height() - $("#login").width())/2;
	$("#login").css({"left":left,"top":top});
	var user = {"userid":1};
	$("input[name=username]").keypress(function(e){
		if(e.which == 13){
			$("input[type=button]").click();
		}
	})
	$("input[type=button]").click(function(){
		user.username = $("input[name=username]").val();
		if( user.username == '' ){
			alert("用户名不能为空");
			return false;
		}
		if( user.username.length > 20 ){
			alert("用户名最多允许20个字符长度");
			return false;
		}
		chat = new Chat();
		chat.sendLogin(user);
		$("#login").hide();
		$("body").append("<div style='position:absolute;z-index:9999;background:white;width:352px;' id='loading'>登陆中，请稍后......</div>");
		var left = ($(window).width() - $("#loading").width())/2;
		var top = ($(window).height() - $("#loading").width())/2;
		$("#loading").css({"left":left,"top":top});
	})
	$(document).keypress(function(e){
		if(e.which == 13){
			$("button[type=submit]").click();
		}
	})
	$("button[type=submit]").click(function(){
		var content = {"userid":1,"username":user.username,"content":$("textarea").val()};
		chat.sendMessage(content, user);
	})
	changeChatTo();
})
function scroll() { 
	var titleInfo = '有新的聊天信息';
	var firstInfo = titleInfo.charAt(0);  
	var lastInfo = titleInfo.substring(1, titleInfo.length); 
	document.title = lastInfo + firstInfo; 
} 
function closePrivateChat(obj){
	obj.parent().remove();
	var tabid = obj.prev().attr('href');
	$("div.tab-content "+tabid).remove();
	$("a[href=#publicchat]").tab('show');
	$("button.send").removeAttr('to');
}
function changeChatTo(){
	$('div ul li a').click(function (e) {
	  //e.preventDefault();
	  var toWhom = $(this).attr("href").replace(/#/, '');
	  if( toWhom == 'publicchat' ){
	  	$("button.send").removeAttr('to');
	  }else{
	  	$("button.send").attr("to", toWhom);
	  }
	  $(this).tab('show');
	})
}