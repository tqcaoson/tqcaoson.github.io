function Fly(fid, type, color, sh, sw, x, y, fly_img, name) {

	if (typeof sh == "undefined" || sh == 0 || typeof sw == "undefined" || sw == 0) {
		if (typeof(window.innerWidth) == 'number') {
			var sw = window.innerWidth;
			var sh = window.innerHeight;
		} else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
			var sw = document.documentElement.clientWidth;
			var sh = document.documentElement.clientHeight;
		} else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
			var sw = document.body.clientWidth;
			var sh = document.body.clientHeight;
		};
	}
	var f = document.createElement("DIV");
	var offset = 200;
	var offsetb = 250;
	var caminando = true;

	if (typeof x == "undefined" || x == 0 || typeof y == "undefined" || y == 0) {
		var x = 0;
		var y = 0;		
		if(Math.random() < 0.5){
			if(Math.random() < 0.5){
				var x = 5;
			} else {
				var x = (sw-50);
			}
			var y = Math.round(Math.random()*(sh-50));
		} else {
			if(Math.random() < 0.5){
				var y = 5;				
			} else {
				var y = (sh-50);				
			}
			var x = Math.round(Math.random()*(sw-50));
		}
		
	}
	
	if (typeof xx == "undefined" || xx == 0) {
		var xx = 3;
	}	
	if (typeof yy == "undefined" || yy == 0) {
		var yy = 3;
	}
	this.movestep = 30;
	this.type = type;
	this.name = name;
	this.color = color;
	this.fid = fid;
	this.move_strange = false;
	if (Math.random() < 0.5) {
		this.gender = "Đực";
	} else {
		this.gender = "Cái";
	}

    var t = document.createElement("DIV");
	t.style.background = '#212121';
	t.style.color = '#fafafa';
	t.style.position = "absolute";
	t.style.zIndex = 9998;
	t.style.minWidth = '120px';
	t.style.minHeight = '100px';
	t.style.margin = '25px 50px';
	t.style.padding = '10px';
	t.style.opacity = '0.95';
	t.style.borderRadius = '3px';
	t.style.boxShadow = '1px 1px 2px 1px #222222';
	t.style.display = 'none';

    f.appendChild(t);
	
	f.title = this.name + "\nLoại: "+this.type+"\nMàu sắc: "+this.color+"\nGiới tính: "+this.gender;
	f.id = fid;
	f.style.width = "50px";
	f.style.height = "50px";
	f.style.backgroundImage = "url(" + fly_img + ")";
	f.style.backgroundPosition = "0px -" + offset + "px";
	f.style.position = "absolute";//"absolute";
	f.style.left = Math.round(x) + "px";
	f.style.top = Math.round(y) + "px";
	f.style.zIndex = 9999;
	f.style.cursor = "pointer";
	var parent = this;
    
    setInterval(function(){
        t.style.display = 'block';
        var value_message = Math.floor(Math.random() * 10) + 1;
        switch (value_message) { 
            case 1: 
                $(t).html(parent.name + " nói:\n"+'"Tĩnh ca ca, sau khi ta chết, huynh phải đáp ứng ta 3 điều!"')
                break;
            case 2: 
                $(t).html(parent.name + " nói:\n"+'"Cô cô, Quá Nhi chỉ cần gặp người, có thể vĩnh viễn ở bên cạnh người."')
                break;
            case 3: 
                $(t).html(parent.name + " nói:\n"+'"Hỏi thế gian tình ái là chi mà đôi lứa thề nguyền sống chết."')
                break;
            case 4: 
                $(t).html(parent.name + " nói:\n"+'"Tỷ phu, cuối cùng chúng ta không ai nợ ai nữa."')
                break;
            case 5: 
                $(t).html(parent.name + " nói:\n"+'"Bà bà không hiểu lòng tiểu ni, các vị sư tỷ cũng không hiểu lòng tiểu ni."')
                break;
            case 6: 
                $(t).html(parent.name + " nói:\n"+'"Ta chỉ muốn hỏi, cuối cùng trong lòng người có hình bóng ta hay không."')
                break;
            case 7: 
                $(t).html(parent.name + " nói:\n"+'"Quá nhi sẽ nhớ 400 lần, sáng 200 lần, chiều 200 lần."')
                break;
            case 8: 
                $(t).html(parent.name + " nói:\n"+'"Ta và huynh tuy không sinh cùng ngày cùng tháng cùng năm nhưng nguyện được chết cùng ngày cùng tháng cùng năm."')
                break;
            case 9: 
                $(t).html(parent.name + " nói:\n"+'"Đứng lại, đừng có chạy!"')
                break;
            case 10: 
                $(t).html(parent.name + " nói:\n"+'"Võ công của ta là vô địch thiên hạ"')
                break;																					
        }
    }, 10000);

	document.body.appendChild(f);
    
    f.addEventListener('click',function(){
        parent.flying();
    },false);

	this.setmove = function(id) {

		var parent = this;
		if (!parent.move_strange){
			if (y >= (sh-50) || Math.random() < 0.005) {
				yy = -yy;
				c();
			} else if (y <= 1 || Math.random() < 0.005) {
				yy = -yy;
				c();
			}
			if (x >= (sw-50) || Math.random() < 0.005) {
				xx = -xx;
				c();
			} else if (x <= 1 || Math.random() < 0.005) {
				xx = -xx;
				c();
			}
		}
		x = x + xx;
		y = y + yy;
		
		f.style.left = Math.round(x) + "px";
		f.style.top = Math.round(y) + "px";



		if (Math.random() < 0.05) {
			clearInterval(id);
			id = setInterval(function() {
				parent.p(id)
			}, this.movestep);
			caminando = false;
			showOffset(offset);
		} else {
			if (caminando) {
				caminando = false;
				showOffset(offset);
			} else {
				caminando = true;
				showOffset(offsetb);
			}
		}

	};
	this.p = function(id, movestep) {
		var parent = this;
		if (Math.random() < 0.075) {
			clearInterval(id);
			id = setInterval(function() {
				parent.setmove(id)
			}, parent.movestep);
		}
	};

	function c() {
		if (yy < 0) {
			if (xx < 0) {
				offset = 100;
				offsetb = 150;
			} else {
				offset = 0;
				offsetb = 50;
			}
		} else if (xx < 0) {
			offset = 300;
			offsetb = 350;
		} else {
			offset = 200;
			offsetb = 250;
		}
	};

	function showOffset(o) {
		f.style.backgroundPosition = "0px -" + o + "px";
	}
	this.move = function() {
		var parent = this;
		var id = setInterval(function() {
			parent.setmove(id);
		}, parent.movestep);
	}
	this.flying = function() {
		
		this.movestep = 0;
		var parent = this;
		timeout = Math.random() * (5000 - 2500) + 2500;

		setTimeout(function(){
			parent.movestep = 30;
		},timeout);	

	}
	this.moveout = function(){
		var parent = this;
		var outw = 0; var outh = 0; 
		if (typeof(window.innerWidth) == 'number') {
			var outw = window.innerWidth;
			var outh = window.innerHeight;
		} else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
			var outw = document.documentElement.clientWidth;
			var outh = document.documentElement.clientHeight;
		} else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
			var outw = document.body.clientWidth;
			var outh = document.body.clientHeight;
		};
		parent.move_strange = true;
		var hide = setInterval(function(){
			if (y >= outh-50 || x >= outw-50 || y <= 0 || x <= 0){
				$("#"+parent.fid).hide();
				parent.move_strange = false;
				clearInterval(hide);
			}
		}, 30);
	}
	this.goback = function(){		
		var parent = this;		
		var outw = 0; var outh = 0; 
		if (typeof(window.innerWidth) == 'number') {
			var outw = window.innerWidth;
			var outh = window.innerHeight;
		} else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
			var outw = document.documentElement.clientWidth;
			var outh = document.documentElement.clientHeight;
		} else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
			var outw = document.body.clientWidth;
			var outh = document.body.clientHeight;
		};
		parent.move_strange = true;
		var show = setInterval(function(){
			if (y >= outh-50 || x >= outw-50 || y <= 0 || x <= 0){
				$("#"+parent.fid).show();
				parent.move_strange = false;	
				clearInterval(show);
			}
		}, 30);
	}
}


$(document).ready(function() {
    var height_fly 	=  0;
    var width_fly 	= 0;
    var sl = Math.floor(Math.random() * 2) + 1  ;
    for(var i = 0; i < sl; i++) {
        var value = Math.floor(Math.random() * 4) + 1  ;
	    // alert(value);
		switch (value) { 
		case 1: 
			var fly = new Fly("test", "Nhặng", "Đen", height_fly, width_fly, 0, 0, "ruoi/doc_co_ruoi.png", "Cô Cô ruồi");	
			break;
		case 2: 
			var fly = new Fly("test", "Nhặng", "Xanh", height_fly, width_fly, 0, 0, "ruoi/ly_mac_ruoi.png", "Dương Quá ruồi");
			break;
		case 3: 
			var fly = new Fly("test", "Nhặng", "Tuyệt sắc", height_fly, width_fly, 0, 0, "ruoi/ruoi_9.png","Độc cô ruồi");
			break;		
		case 4: 
			var fly = new Fly("test", "Nhặng", "Hồng", height_fly, width_fly, 0, 0, "ruoi/ruoi_11.png", "Lý Mạc ruồi");
			break;
		}
		fly.move();	
    }
});