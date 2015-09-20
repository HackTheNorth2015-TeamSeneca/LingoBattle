var HashTable = function () {
	this.ht = {};
	this.size = 0;
};
HashTable.prototype.insert = function(key, value) {
	if (!this.ht.hasOwnProperty(key)) {
		++this.size;	
	} 
	this.ht[key] = value;
};
HashTable.prototype.remove = function(key) {
	if (this.ht.hasOwnProperty(key)) {
		delete this.ht[key];
		--this.size;
	}
};
HashTable.prototype.get = function(key) {
	if (this.ht.hasOwnProperty(key)) {
		return this.ht[key];
	}
	return null;
};
HashTable.prototype.contains = function(key) {
	if (this.ht.hasOwnProperty(key)) {
		return true;
	}
	return false;
};
HashTable.prototype.isEmpty = function() {
	return this.size < 1;
};
HashTable.prototype.getAllValues = function() {
	var all = [];
	for(var key in this.ht) {
		all.push(this.ht[key]);
	}	
	return all;
};	

var Helper = {};
Helper.getSVGTextImage = function(textOptions, callback){
	var text = textOptions.text;
	var color = textOptions.color;

    var data = 'data:image/svg+xml,' + '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="300" height="300" viewBox="0 0 300 300"><text x="150" y="150" fill="'+color+'" font-size="20" style="text-anchor: middle; dominant-baseline: bottom;">' + text + '</text></svg>';
    var img = new Image();
    var canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    var ctx = canvas.getContext("2d");
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        var pngImg = new Image();
        pngImg.onload = function(){
            svg = null;
            canvas = null;
            ctx = null;
            img = null;
            if(callback) 
            	callback(pngImg);
        }
        pngImg.src = canvas.toDataURL("image/png")
    };
    img.src = data;
};
Helper.positionImageText = function(textOptions, positionOptions) {
    this.getSVGTextImage(textOptions , function(img){
        var sprite = new THREE.Texture(img);
        sprite.minFilter = THREE.LinearFilter;
        sprite.needsUpdate = true;
        var sp = new THREE.SpriteMaterial({
            map: sprite,
            color: 0xffffff
        });
        var mesh = new THREE.Sprite(sp);
        mesh.scale.multiplyScalar(300);

        var position = positionOptions.position;
        mesh.position.set(position.x, position.y, position.z);
        
        var parent = positionOptions.parent;
        parent.add(mesh);
    });
};
Helper.keyToCharMap = (function () {
	var map = new HashTable();
	var keyCodesChars = ["a", 65,"b", 66,"c", 67,"d", 68,"e", 69,"f", 70,"g", 71,"h", 72,"i", 73,"j", 74,"k", 75,"l", 76,"m", 77,"n", 78,"o", 79,"p", 80,"q", 81,"r", 82,"s", 83,"t", 84,"u", 85,"v", 86,"w", 87,"x", 88,"y", 89,"z", 90, " ", 32, "'", 222];
	for (var i = 1; i < keyCodesChars.length; i += 2) {
		map.insert(keyCodesChars[i], keyCodesChars[i - 1]);
	}
	return map;
})();

// mark - 

var Player = function (level, name) {
	this.name = name;
	this.score = 0;
	this.level = level;
	this.hp = 7 * (this.level + 1);
	this.hpTotal = this.hp;

	// player object
	var size = 50;
	var geometryH = new THREE.BoxGeometry(size, 20, 20, 2, 2, 2); 
	var geometryV = new THREE.BoxGeometry(20, 20, size, 2, 2, 2); 
	var materialRed = new THREE.MeshLambertMaterial({ 
		color: 0x903535
	});
	this.size = size;

	var objectV = new THREE.Mesh(geometryV, materialRed);
	var objectH = new THREE.Mesh(geometryH, materialRed);
	objectH.add(objectV);

	this.object = new THREE.Object3D();
	this.object.position.y = 10;
	this.object.add(objectH);

	// player attack field
	this.radiusIdx = 2;
	this.radiuses = [100, 150, 200];
	var radius = this.size + this.radiuses[this.radiusIdx];
	var geometry = new THREE.CylinderGeometry(radius, radius, 1, 32);
	var material = new THREE.MeshBasicMaterial({ 
		color: 0xff0000,
		// color: 0xF70000,
		transparent: true, 
		opacity: 0.2
	});
	this.attackField = new THREE.Mesh(geometry, material);
	this.attackField.radius = radius;
	this.object.add(this.attackField);

	var that = this;
	// player contols
	this.movementControls = {
		movementParams: {
			moveForward: false,
			moveBackward: false,
			moveLeft: false,
			moveRight: false,
			velocity: new THREE.Vector3()
		},
		onKeyDown: function (event) {
			var mp = this.movementParams;
			switch (event.keyCode) {
				case 38: // up
					mp.moveForward = true;
					break;
				case 37: // left
					mp.moveLeft = true; 
					break;
				case 40: // down
					mp.moveBackward = true;
					break;
				case 39: // right
					mp.moveRight = true;
					break;
				case 187: { // +
					var newRadiusIdx = Math.min(2, that.radiusIdx + 1);
					that.updateAttackRadius(newRadiusIdx);
					break;
				}
				case 189: { // -
					var newRadiusIdx = Math.max(0, that.radiusIdx - 1);
					that.updateAttackRadius(newRadiusIdx);
					break;
				}
			}
		},
		onKeyUp: function (event) {
			var mp = this.movementParams;
			switch(event.keyCode) {
				case 38: // up
					mp.moveForward = false;
					break;
				case 37: // left
					mp.moveLeft = false;
					break;
				case 40: // down
					mp.moveBackward = false;
					break;
				case 39: // right
					mp.moveRight = false;
					break;
			}
		}
	};

	var mc = this.movementControls;
	document.addEventListener('keydown', mc.onKeyDown.bind(mc), false);
	document.addEventListener('keyup', mc.onKeyUp.bind(mc), false);

	var textOptions = {
		text: this.name,
		color: "red"
	};
	var positionOptions = {
		parent: this.object,
		position: new THREE.Vector3(0, 30, 0)
	};
	Helper.positionImageText(textOptions, positionOptions);
};
Player.prototype.updateAttackRadius = function (newRadiusIdx) {
	if (newRadiusIdx == this.radiusIdx) {
		return; 
	}
	this.radiusIdx = newRadiusIdx;				
	var radius = this.size + this.radiuses[this.radiusIdx];
	var geometry = new THREE.CylinderGeometry(radius, radius, 1, 32);
	this.attackField.geometry = geometry;
	this.attackField.radius = radius;
};
Player.prototype.kill = function () {
	if (this.hp > 0)
		--this.hp;
};
Player.prototype.isDead = function () {
	return this.hp < 1;
};
Player.prototype.getSpeed = function () {
	return 400.0 * (this.level + 1);
};

var Bot = function (level, pair, id) {
	this.idx = 0;
	this.word = pair.first;
	this.translation = pair.second;
	this.hp = this.word.length;
	this.id = id;

	this.rate = this.word.length;
	this.level = level;

	var size = Math.min(30, 4 * this.rate);
	var geometry = new THREE.BoxGeometry(size, size, size);
	var material = new THREE.MeshLambertMaterial({
		color: 0x808080
	});
	this.object = new THREE.Mesh(geometry, material);
	this.object.position.y = 10;
	this.size = size;

	var textOptions = {
		text: this.translation,
		color: "black"
	};
	var positionOptions = {
		parent: this.object,
		position: new THREE.Vector3(0, 30, 0)
	};
	Helper.positionImageText(textOptions, positionOptions);
};
Bot.prototype.getSpeed = function () {
	return 100.0 * (this.level + 1) / Math.max(1, this.rate);
};
Bot.prototype.canBeInjured = function (ch) {
	if (this.idx < this.word.length) {
		if (this.word[this.idx] == ch) {
			return true;
		}
	}
	return false;
};
Bot.prototype.injure = function (ch) {
	if (this.idx < this.word.length) {
		if (this.word[this.idx] == ch) {
			++this.idx;
			this.updateProgress();
		}
	}
};
Bot.prototype.kill = function () {
	if (this.hp > 0) {
		--this.hp;
	}
};
Bot.prototype.heal = function () {
	if (this.idx < this.word.length) {
		this.clearProgress();
		this.idx = 0;
		this.hp = this.word.length;
	}
};
Bot.prototype.isDead = function () {
	return this.hp < 1;
};
Bot.prototype.invalidate = function () {
	this.clearProgress();
	this.idx = this.word.length;
	this.hp = 0;
};
// TODO: destroy label properly
Bot.prototype.clearProgress = function () {
	if (this.object.children.length == 2) {
		var label = this.object.children[1];
		this.object.remove(label);
	}
};
Bot.prototype.updateProgress = function () {
	var wordProgress = this.word.substring(0, this.idx);
	// console.log(wordProgress);
	var textOptions = {
		text: wordProgress,
		color: "red"
	};
	var positionOptions = {
		parent: this.object,
		position: new THREE.Vector3(0, 55, 0)
	};
	this.clearProgress();
	Helper.positionImageText(textOptions, positionOptions);
};

var Rocket = function (target, ch) {
	this.target = target;
	this.ch = ch;

	var size = 5;
	var geometry = new THREE.BoxGeometry(size, size, size);
	var materialRed = new THREE.MeshLambertMaterial({ 
		color: 0x903535
	});
	this.size = size;	

	var object = new THREE.Mesh(geometry, materialRed);
	this.object = object;
};
Rocket.prototype.getSpeed = function () {
	return 350.0;
};

// mark -

var GamePlay = function (settings) {
	if (!this.validateSettings(settings))
		return;

	this.settings = settings;

	// canvas
	this.aspect = window.innerWidth / window.innerHeight;
	this.buttleFieldRadiusUsed = 930;

	this.buttleFieldWidth = 1500;
	this.buttleFieldHeight = 1500;
	this.buttleFieldRadius = 1000;

	this.buttleFieldHeightTopDown = 1000;
	this.buttleFieldWidthTopDown = this.aspect * this.buttleFieldHeightTopDown;

	// graphics
	// this.raycaster = null;
	this.scene = null;
	this.cameraTopDown = null;
	this.renderer = null;
	this.requestedAnimationFrameId = 0;

	this.container = null;
	this.isGamePlayVisible = false;

	// game play
	this.prevTime = performance.now();
	this.bots = [];
	this.botsInAttackField = new HashTable();
	this.rockets = [];
	this.player = null;

	// sound
	this.shootSound = new Audio("mp3/gunShoot.mp3");
	this.bangSound = new Audio("mp3/gunBang.mp3");

	// initialization
	this.init(this);
	this.animate(this);

	document.addEventListener('keydown', this.onKeyDown.bind(this), false);
};

GamePlay.prototype.validateSettings = function (settings) {
	// word pairs
	if (settings.hasOwnProperty("wordsPairs")) {
		var wordsPairs = settings.wordsPairs;
		if (wordsPairs.length < 1) {
			console.log("Words Pairs are empty!");
			return false;
		}
		for (var i = 0; i < wordsPairs.length; ++i) {
			var pair = wordsPairs[i];
			if (!pair.hasOwnProperty("first") || !pair.hasOwnProperty("second")) {
				console.log("Pairs are invalid!");
				return false;
			}
		}
	} else {
		console.log("Words Pairs are invalid!");
		return false;
	}

	// username
	if (settings.hasOwnProperty("playerName")) {
		var name = settings.playerName;
		settings.playerName = name.length < 20 ? name : name.substring(0, 20);
	} else {
		settings.playerName = "username";
	}
	
	// difficulty level
	if (settings.hasOwnProperty("difficultyLevel")) {
		var diffLevel = settings.difficultyLevel;
		settings.difficultyLevel = Math.max(0, Math.min(diffLevel, 2));
	} else {
		settings.difficultyLevel = 0;
	}

	// callbacks
	if (!settings.hasOwnProperty("onGameOver")) {
		settings.onGameOver = function (progress) {
			// console.log("Game Over! (default)");
			// console.log(progress);
		};
	}
	if (!settings.hasOwnProperty("onLevelComplete")) {
		settings.onLevelStart = function (progress) {
			// console.log("Started! (default)");
			// console.log(progress);
		};
	}
	if (!settings.hasOwnProperty("onLevelComplete")) {
		settings.onLevelComplete = function (progress) {
			// console.log("Congrats! (default)");
			// console.log(progress);
		};
	}
	if (!settings.hasOwnProperty("onProgressChange")) {
		settings.onProgressChange = function (progress) {
			// console.log("Progress change! (default)");
			// console.log(progress);
		};
	}
	return true;
};

GamePlay.prototype.onKeyDown = function (event) {
	var code = event.keyCode;
	if (Helper.keyToCharMap.contains(code)) {
		var ch = Helper.keyToCharMap.get(code);
		if (!this.botsInAttackField.isEmpty()) {
			var allBots = this.botsInAttackField.getAllValues();
			for(var i = 0; i < allBots.length; ++i) {
				var bot = allBots[i];
				if (bot.canBeInjured(ch)) {
					bot.injure(ch);

					this.shootSound.currentTime = 0;
					this.shootSound.play();

					var rocket = new Rocket(bot, ch);
					this.rockets.push(rocket);

					var pObject = this.player.object;
					var rObject = rocket.object;
					rObject.position.set(
						pObject.position.x, 
						pObject.position.y, 
						pObject.position.z
					);
					this.scene.add(rObject);
				}
			}
		}
	}
};

GamePlay.prototype.init = function () {
	this.initGraphics(this);

	this.initButtleField(this);
	this.initPlayer(this);
	this.initBots(this);
};
GamePlay.prototype.initGraphics = function () {
	// scene
	this.scene = new THREE.Scene();

	// camera
	var coef = 1;
	this.cameraTopDown = new THREE.OrthographicCamera(
		-0.5 * this.buttleFieldWidthTopDown * coef,
		0.5 * this.buttleFieldWidthTopDown * coef,
		0.5 * this.buttleFieldHeightTopDown * coef,
		-0.5 * this.buttleFieldHeightTopDown * coef,
		-0.00001, 1000000
	);
	this.cameraTopDown.position.set(0, 800, 1000);
	this.scene.add(this.cameraTopDown);
	this.cameraTopDown.lookAt(new THREE.Vector3());
	this.cameraTopDown.updateProjectionMatrix();

	// light
	var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
	light.position.set(0.5, 1, 0.75);
	this.scene.add(light);

	var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
	directionalLight.position.set(0.5, 1, 0.75);
	this.scene.add(directionalLight);
	
	// raycaster
	// this.raycaster = new THREE.Raycaster(
	// 	new THREE.Vector3(), 
	// 	new THREE.Vector3(), 
	// 	0, 1000000
	// );

	// renderer
	this.containerWidth = window.innerWidth;
	this.containerHeight = window.innerHeight;

	var container = document.createElement("div");	
	this.container = container;
	container.style.left = 0 + "px";
	container.style.top = 0 + "px";
	container.style.width = "100%";
	container.style.height = "100%";
	container.style.position = "absolute";
	// container.style.background = '#333333';

	this.renderer = new THREE.WebGLRenderer();
	this.renderer.setClearColor(0xffffff);
	this.renderer.setPixelRatio(window.devicePixelRatio);
	// TODO:
	this.renderer.setSize(this.containerWidth, this.containerHeight);
	
	var canvas = this.renderer.domElement;
	canvas.style.opacity = "0.0";
	canvas.style.position = "absolute";
	canvas.style.top = 0.0 + "px";
	canvas.style.left = 0.0 + "px";
	container.appendChild(canvas);
	
	// TODO:
	document.body.appendChild(this.container);
};
GamePlay.prototype.initButtleField = function () {
	// buttlefield
	var radius = this.buttleFieldRadius;
	var geometry = new THREE.CylinderGeometry(radius, radius, 0.1, 64);
	// var geometry = new THREE.PlaneGeometry(this.buttleFieldWidth, this.buttleFieldHeight, 10, 10);
	// geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
	var material = new THREE.MeshLambertMaterial({
		color: 0xcccccc
	});
	var buttleField = new THREE.Mesh(geometry, material);
	this.scene.add(buttleField);

	// background
	var geometryBG = new THREE.PlaneGeometry(1000000, 1000000, 10, 10);
	geometryBG.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
	var materialBG = new THREE.MeshLambertMaterial({
		color: 0xeeeeee
	});
	var buttleFieldBackground = new THREE.Mesh(geometryBG, materialBG);
	buttleFieldBackground.position.y = -1;
	this.scene.add(buttleFieldBackground);

	// center
	var materialBlue = new THREE.MeshBasicMaterial({		
		color: 0xeeeeee
	});
	var size = 40;				
	var geometry = new THREE.CylinderGeometry(size, size, 1, 32);
	var center = new THREE.Mesh(geometry, materialBlue);
	this.scene.add(center);
};
GamePlay.prototype.initPlayer = function () {
	// player
	var level = this.settings.difficultyLevel;
	var name = this.settings.playerName;
	this.player = new Player(level, name);
	var pObject = this.player.object;
	this.scene.add(pObject);
};
GamePlay.prototype.initBots = function () {
	var wordsPairs = this.settings.wordsPairs;
	if (wordsPairs.length < 1)
		return;

	var level = this.settings.difficultyLevel;
	var rMax = this.buttleFieldRadiusUsed;
	var rMin = this.player.attackField.radius;
	var delta = 2 * Math.PI / wordsPairs.length;
	var phi = 0;
	
	for (var i = 0; i < wordsPairs.length; ++i, phi += delta) {
		var pair = wordsPairs[i];
		var id = i;

		var bot = new Bot(level, pair, id);
		this.bots.push(bot);

		var r = rMin + Math.random() * (rMax - rMin);
		var x = r * Math.cos(phi);
		var z = r * Math.sin(phi);
		
		var bObject = bot.object;
		bObject.position.x = x;
		bObject.position.y = 10;
		bObject.position.z = z;
		this.scene.add(bObject);
	}
};

// TODO:
GamePlay.prototype.destroy = function () {
};

// animation

GamePlay.prototype.animate = function () {
	this.requestedAnimationFrameId = window.requestAnimationFrame(this.animate.bind(this));
	this.render();
	if (!this.isGamePlayVisible && this.requestedAnimationFrameId) {
		this.isGamePlayVisible = true;
		this.transitionIn();
		this.settings.onLevelStart({
			hpTotal: this.player.hpTotal,
			hp: this.player.hp,
			score: this.player.score
		});
	} 
};
GamePlay.prototype.render = function () {
	if (!this.player || this.player.isDead()) {
		if (this.requestedAnimationFrameId) {
			window.cancelAnimationFrame(this.requestedAnimationFrameId);
			this.requestedAnimationFrameId = 0;
		}

		this.settings.onGameOver({
			hpTotal: this.player.hpTotal,
			hp: this.player.hp,
			score: this.player.score
		});
	} else if (this.bots.length < 1) {
		if (this.requestedAnimationFrameId) {
			window.cancelAnimationFrame(this.requestedAnimationFrameId);
			this.requestedAnimationFrameId = 0;
		}

		this.settings.onLevelComplete({
			hpTotal: this.player.hpTotal,
			hp: this.player.hp,
			score: this.player.score
		});
	} else {
		var time = performance.now();
		var delta = (time - this.prevTime) * 0.001;

		this.animatePlayerAndCamera(delta);		
		this.animateBots(delta);
		this.animateRockets(delta);

		this.prevTime = time;
	} 
	this.renderer.render(this.scene, this.cameraTopDown);
};
GamePlay.prototype.animatePlayerAndCamera = function (delta) {
	// player animation
	var pObject = this.player.object;
	var mp = this.player.movementControls.movementParams;
	mp.velocity.x -= mp.velocity.x * 10.0 * delta;
	mp.velocity.z -= mp.velocity.z * 10.0 * delta;
	mp.velocity.y = 0;
	if (mp.moveForward) 
		mp.velocity.z -= this.player.getSpeed() * delta;
	if (mp.moveBackward) 
		mp.velocity.z += this.player.getSpeed() * delta;
	if (mp.moveLeft) 
		mp.velocity.x -= this.player.getSpeed() * delta;
	if (mp.moveRight) 
		mp.velocity.x += this.player.getSpeed() * delta;

	var pPosition = pObject.position.clone();
	pPosition.x += mp.velocity.x * delta;
	pPosition.y += mp.velocity.y * delta;
	pPosition.z += mp.velocity.z * delta;
	if (this.buttleFieldRadiusUsed > pPosition.length()) {
		pObject.position.set(pPosition.x, pPosition.y, pPosition.z);
		this.alignObjectDirection(pObject, mp.velocity);

		// camera animation
		var pPosition = this.cameraTopDown.position.clone();
		pPosition.x += mp.velocity.x * delta;
		pPosition.y += mp.velocity.y * delta;
		pPosition.z += mp.velocity.z * delta;
		this.cameraTopDown.position.set(pPosition.x, pPosition.y, pPosition.z);
	}
};
GamePlay.prototype.animateRockets = function (delta) {
	// TODO: destroy rockets properly
	var rockets = [];
	for (var i = 0; i < this.rockets.length; ++i) {
		var rocket = this.rockets[i];
		var bot = rocket.target;

		var rObject = rocket.object;
		var bObject = bot.object;
		var x = bObject.position.x - rObject.position.x;
		var y = 0;
		var z = bObject.position.z - rObject.position.z;
		var toBotFromRocket = new THREE.Vector3(x, y, z);
		if (toBotFromRocket.length() > 5) {
			toBotFromRocket.normalize();
	
			var target = toBotFromRocket;
			var rPosition = rObject.position.clone();
			rPosition.x += target.x * rocket.getSpeed() * delta;
			rPosition.y += target.y * rocket.getSpeed() * delta;
			rPosition.z += target.z * rocket.getSpeed() * delta;
			rObject.position.set(rPosition.x, rPosition.y, rPosition.z);

			rockets.push(rocket);
		} else {
			bot.kill();

			this.bangSound.currentTime = 0;
			this.bangSound.play();

			if (bot.isDead()) {
				this.botsInAttackField.remove(bot.id);
				this.scene.remove(bObject);

				this.player.score += bot.word.length;
				this.settings.onProgressChange({
					hpTotal: this.player.hpTotal,
					hp: this.player.hp,
					score: this.player.score
				});
			}
			this.scene.remove(rObject);
		}
	}
	this.rockets = rockets;
};
GamePlay.prototype.animateBots = function (delta) {
	var pObject = this.player.object;
	// TODO: destroy bots properly
	var bots = [];
	for (var i = 0; i < this.bots.length; ++i) {
		var bot = this.bots[i];
		if (bot.isDead()) {
			this.botsInAttackField.remove(bot.id);
			continue;
		}

		var bObject = bot.object;
		var x = pObject.position.x - bObject.position.x;
		var y = 0;
		var z = pObject.position.z - bObject.position.z;

		var toPlayerFromBot = new THREE.Vector3(x, y, z);
		toPlayerFromBot.normalize();
		
		var toBotFromPlayer = new THREE.Vector3(-x, -y, -z);
		// toBotFromPlayer.normalize();

		// this.raycaster.set(pObject.position, toBotFromPlayer);
		// var intersections = this.raycaster.intersectObjects([bObject]);

		var target = toPlayerFromBot;
	    // if (intersections.length > 0 && intersections[0].distance > this.player.attackField.radius) { 
		if (toBotFromPlayer.length() > this.player.size) {
		    if (toBotFromPlayer.length() > this.player.attackField.radius) { 
		    	var up = new THREE.Vector3(0, 1, 0);
		    	var toBotFromCenter = bObject.position;
		    	if (bot.id % 2) {
					target.crossVectors(toBotFromCenter, up);
		    	} else {
					target.crossVectors(up, toBotFromCenter);
		    	}
				target.normalize();

				bot.heal();
				this.botsInAttackField.remove(bot.id);
		    } else if (toBotFromPlayer.length() > 5) {
		    	this.botsInAttackField.insert(bot.id, bot);
		    }

			var bPosition = bObject.position.clone();
			bPosition.x += target.x * bot.getSpeed() * delta;
			bPosition.y += target.y * bot.getSpeed() * delta;
			bPosition.z += target.z * bot.getSpeed() * delta;
			if (this.buttleFieldRadiusUsed > bPosition.length()) {
				bObject.position.set(bPosition.x, bPosition.y, bPosition.z);
				this.alignObjectDirection(bObject, target);
			}

			bots.push(bot);
		} else {
			this.player.kill();

			this.bangSound.currentTime = 0;
			this.bangSound.play();

	    	bot.invalidate();

	    	this.botsInAttackField.remove(bot.id);
	    	this.scene.remove(bObject);

	    	this.settings.onProgressChange({
	    		hpTotal: this.player.hpTotal,
				hp: this.player.hp,
				score: this.player.score
			});
		}
	}
	this.bots = bots;
};

// appearance

GamePlay.prototype.alignObjectDirection = function (object, vector) {
	var a = new THREE.Vector3(0, 0, -1);
	var b = vector.clone().normalize();
	var angle =  Math.acos(a.dot(b));
	var cross = new THREE.Vector3();
	cross.crossVectors(a, b);

	var quaternion = new THREE.Quaternion().setFromAxisAngle(cross.normalize(), angle);
    object.rotation.setFromQuaternion(quaternion);
};
GamePlay.prototype.transitionIn = function (callback) {
	function onComplete() {
		if (callback !== undefined) {
			callback();
		}
	};

	function setOpacity(opacity, element) {
	    element.style.opacity = opacity;
	    element.style.filter = 'alpha(opacity=' + opacity + ')';
	};

	function fadeIn(opacityFrom, opacityTo, element) {
	    setOpacity(opacityFrom, element);
	    var delta = 0.01;

	    function updateOpacity () {
    		var opacity = Number(element.style.opacity);
    		if (opacity < Math.min(1.0, opacityTo)) {
    			opacity += delta;
	        	setOpacity(opacity, element);
	        	setTimeout(updateOpacity, 5);
	    	} else {
	    		onComplete();
	    	}
    	};
    	setTimeout(updateOpacity, 500);
	};

	var canvas = this.renderer.domElement;
	fadeIn(0.0, 1.0, canvas);
};