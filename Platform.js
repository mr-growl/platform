/*
 *	function Main()
 *	{
 *		this.stage = null;
 *		this.scroller - new Scroller(this.stage);
 *	}
 *	Main.SCROLL_SPEED = 5;
 *	Main.prototype.update = function()
 *	{
 *		this.scroller.move..
 *		requestAnimFrame(this.update.bind(this));
 *	}
 *	function Far()
 *	{
 *		
 *	}
 *	Far.constructor = Far;
 *	Far.prototype = Object.creaate(PIXI.TilingSprite.prototype);
 */
function Platform()
{
	this.renderer;
	this.stage;
	this.crawl_speed = 1;
	this.low_speed = 4;
	this.high_speed = 8;
	this.max_speed = this.low_speed;
	this.max_drop = 8;
	this.acc = 0.4;
	this.dec = 1.2;
	this.air_dec = 0.1;
	this.h_speed = 0;
	this.v_speed = 0;
	this.max_v_drop = 24*12;
	this.v_drop = 0;
	this.jumpspeed = -8;
	this.varijump = true;
	this.duck = false;
	this.current_h_direction = 1;

	this.max_bullets = 30;
	this.bullets = [];
	this.bullet_speed = 20;
	this.flying_bullets = [];

	this.ladder_motion = 0;
	this.on_ladder = false;
	this.ladder_climb = 3;

	this.basic_enemies = [];
	this.enemy_radius = 900;
	this.basic_enemy_speed = 1;

	this.going = 0;
	this.current_h_direction = -1;
	this.levelmap;
        this.levelctx;
        this.leveldata;
	this.textures = {};
	this.level_sprites;
	this.collision_map;
	this.jumping = true;
	this.dbljump = false;
	this.walljump = false;
	this.last_walljump_dir = 0;
	this.walljump_dir = 0;
	this.walljumpx = 0;
	this.walljumped = false;
	this.max_wall_jump_frames = 240;
	this.wall_jump_frames = 0;
	this.wall_jump_hit = false;
	this.txt_dummy;
	this.txt_dummy_duck;

	this.level_texture_0;

	this.viewport = {x:800,y:600};
	this.viewport_half = {x:parseInt(this.viewport.x/2),y:parseInt(this.viewport.y/2)};
	this.viewport_bound = {x:0,y:0};

	this.cnt_character_bubble = new PIXI.Container();

	this.key_reg =
	{
		up:false,
		down:false,
		left:false,
		right:false,
		jump:false,
		run:false,
		shoot:false
	}
	this.sketch_pad = document.createElement('canvas');
       	this.sketch_ctx = this.sketch_pad.getContext('2d');

	//This will be our camera top/left value
	this.camera_view = 
	{
		x:0,
		y:0
	}
	this.level_bounds =
	{
		top:0,
		left:0,
		bottom:0,
		right:0
	}

	this.keystates = [];

	for(var i=0;i<=100;i++)
	{
		this.keystates[i] = false;
	}

	this.jumptime=false;
	
	this.current_level = 0;
		
	this.levels =
	[
		{
			name:'level0',
			title:'Introduction',
			map:'level0.bmp'
		},
		{
			name:'level1',
			title:'Get moving',
			map:'level1.bmp'
		}
	];
}

Platform.prototype.preload = function()
{
	var texture_list = 
	[
		'basicbrick.png',
		'basic_enemy.png',
		'dummy.png',
		'ducky.png',
		'bullet.png',
		'ladder.png',
		'level0.bmp',
		'level1.bmp'
	];
	var texture_count = texture_list.length;
	var textures_loaded = 0;
	for(var i=0;i<texture_list.length;i++)
	{
		var name = texture_list[i].split('/')[texture_list[i].split('/').length-1];
		this.textures[name] =
		{
			name:name,
			file:texture_list[i],
			image: new Image()
		};
		var self = this;
		this.textures[name].image.onload = function()
		{
			textures_loaded++;
			if(textures_loaded >= texture_count)
			{
				self.load_check();
			}
		}
		this.textures[name].image.src = texture_list[i];
	}
}

Platform.prototype.load_check = function()
{
	this.init();
}

Platform.prototype.init = function()
{
	console.log('LOADED');

	this.levelmap = document.createElement('canvas');
       	this.levelctx = this.levelmap.getContext('2d');

	// create an new instance of a pixi stage
	this.stage = new PIXI.Stage(0x66FF99);
 
	// create a renderer instance.
	this.renderer = PIXI.autoDetectRenderer(this.viewport.x,this.viewport.y);
 
	// add the renderer view element to the DOM
	document.body.appendChild(this.renderer.view);
	//these might be a problem
	var self = this;
	$('body').on('keydown',function(event){self.keyhandler(event,'keydown');});
	$('body').on('keyup',  function(event){self.keyhandler(event,'keyup');});
 
	// create a texture from an image path
	//THIS SHOULD BE LOADED FROM THE ASSET LOADER
	this.txt_dummy =		PIXI.Texture.fromImage(this.textures['dummy.png'].file);
	this.txt_dummy_duck =		PIXI.Texture.fromImage(this.textures['ducky.png'].file);
	this.txt_bullet =		PIXI.Texture.fromImage(this.textures['bullet.png'].file);
	this.txt_ladder = 		PIXI.Texture.fromImage(this.textures['ladder.png'].file);

	// create a new Sprite using the texture
	this.spt_dummy = new PIXI.Sprite(this.txt_dummy);
 
	// center the sprites anchor point
	this.spt_dummy.anchor.x = 0.5;
	this.spt_dummy.anchor.y = 0;

	for(var i=0;i<this.max_bullets;i++)
	{
		this.bullets[i] = new PIXI.Sprite(this.txt_bullet);
		this.bullets[i].anchor.x = 0.5;
		this.bullets[i].anchor.y = 0.5;
		this.bullets[i].visible = false;
	}

	this.txt_basic_block = PIXI.Texture.fromImage(this.textures['basicbrick.png'].file);
	this.txt_basic_enemy = PIXI.Texture.fromImage(this.textures['basic_enemy.png'].file);

	this.stage_level(this.current_level);

	requestAnimationFrame( this.animate.bind(this) );
}

Platform.prototype.stage_level = function(level)
{
	this.stage.removeChildren();

	this.h_speed = 0;
	this.v_speed = 0;

	this.jumping = false;
	this.v_speed = 0;
	this.v_drop = 0;

	this.draw_backgrounds();

	//Draw the layer that the player interacts with
	this.level_start = this.draw_level(this.map_to_struct(this.textures[this.levels[level].map].image));
 
	this.cnt_character_bubble.removeChildren();
	this.cnt_character_bubble.addChild(this.spt_dummy);
	for(var i=0;i<this.bullets.length;i++)
	{
		this.cnt_character_bubble.addChild(this.bullets[i]);
	}

	for(var i=0;i<this.basic_enemies.length;i++)
	{
		this.cnt_character_bubble.addChild(this.basic_enemies[i].sprite);
	}
	//add the character bubble (this is in front of all the other layers so far)
	this.stage.addChild(this.cnt_character_bubble);
		
	//now draw the foreground layer if there is one (this is stuff that the player and
	//enemies can move behind but cannot interact with).
	this.draw_foreground();

	//console.log(this.level_start);
	// move the sprite t the center of the screen
	this.set_character_position(this.level_start.i*24,this.level_start.j*24);
}

Platform.prototype.animate = function()
{
	if(this.varijump && this.jumptime)
	{
		this.v_speed-=1;
		if(this.v_speed < this.jumpspeed)
		{
			this.jumptime = false;
			this.v_speed = this.jumpspeed;
		}
	}
    	requestAnimationFrame( this.animate.bind(this) );
 	
	for(var i=this.flying_bullets.length-1;i>=0;i--)
	{
		if(!this.bullet_move(this.flying_bullets[i]))
		{
			this.flying_bullets[i].bullet.visible = false;
			this.bullets.push(this.flying_bullets[i].bullet)
			this.flying_bullets.splice(i,1);
		}
	}
	for(var i=0;i<this.basic_enemies.length;i++)
	{
		if(this.basic_enemies[i].direction != 0)
		{
			var newpos = this.basic_enemies[i].sprite.position.x + this.basic_enemies[i].direction*this.basic_enemy_speed;
			if((this.basic_enemies[i].direction > 0 && newpos >= this.basic_enemies[i].right_bound) || (this.basic_enemies[i].direction < 0 && newpos <= this.basic_enemies[i].left_bound))
			{
				//turn around
				this.basic_enemies[i].sprite.width *= -1;
				this.basic_enemies[i].direction *= -1;
			}
			this.basic_enemies[i].sprite.position.x += this.basic_enemies[i].direction*this.basic_enemy_speed;
		}
	}
	this.new_vertical_speed(this.spt_dummy.position.x,this.spt_dummy.position.y);

	this.new_horizontal_speed(this.spt_dummy.position.x,this.spt_dummy.position.y+this.v_speed);


	this.set_character_position(this.spt_dummy.position.x + this.h_speed,this.spt_dummy.position.y + this.v_speed);

    	// render the stage   
    	this.renderer.render(this.stage);
}

Platform.prototype.set_character_position = function(x,y)
{
	this.spt_dummy.position.x = x;
	this.spt_dummy.position.y = y;
	//if(Math.abs(this.spt_dummy.width > 1))
	//{
		//console.log(this.current_h_direction,this.spt_dummy.width)
		//if((this.current_h_direction * this.spt_dummy.width) < 0)
		//{
			//if(this.spt_dummy.width > 0)
			//{
				//this.spt_dummy.width = -24;
			//}
			//else
			//{
				//this.spt_dummy.width = 24;
			//}
		//}
	//}

	ntx = x-this.viewport_half.x;
	nty = y-this.viewport_half.y;

	ntx = (ntx < 0 ? 0 : (ntx > this.viewport_bound.x ? this.viewport_bound.x : ntx));
	nty = (nty < 0 ? 0 : (nty > this.viewport_bound.y ? this.viewport_bound.y : nty));

	//Slowest
	this.level_tile_4.tilePosition.x = parseInt(-ntx/4);
	this.level_tile_4.tilePosition.y = parseInt(-nty/4);

	//Slower
	this.level_tile_3.tilePosition.x = parseInt(-ntx/2);
	this.level_tile_3.tilePosition.y = parseInt(-nty/2);

	//Normal
	this.level_tile_2.tilePosition.x = -ntx;
	this.level_tile_2.tilePosition.y = -nty;

	//Faster
	this.level_tile_1.tilePosition.x = -ntx;
	this.level_tile_1.tilePosition.y = -nty;

	//Fastest
	this.level_tile_0.tilePosition.x = -ntx*2;
	this.level_tile_0.tilePosition.y = -nty*2;

	this.cnt_character_bubble.position.x = -ntx;
	this.cnt_character_bubble.position.y = -nty;
}

Platform.prototype.bullet_move = function(bullet_obj)
{
	var new_x = bullet_obj.bullet.position.x + bullet_obj.direction*this.bullet_speed;
	var col = this.test_collision(new_x,bullet_obj.bullet.position.y,'bullet');
	if(col.collision)
	{
		switch(col.collision_type)
		{
			case 'wall':
				return(false);
				break;
			case 'basic_enemy':
				this.basic_enemies[col.collision_index].sprite.visible = false;
				//SHOULD REALLY BE REMOVEING THE SPRITE FROM THE CONTAINER HERE
				this.basic_enemies.splice(col.collision_index,1);
				return(false);
				break;
			default:
				bullet_obj.bullet.position.x = new_x;
				return(true);
		}
	}
	else
	{
		bullet_obj.bullet.position.x = new_x;
		return(true);
	}
}

Platform.prototype.draw_level = function(level_struct)
{
	/*
	 * The way I'm going to o about doing the big 2-d scrolling map is to
	 * draw all of the static parts of the level onto a regular 2d canvas
	 * and then create an image from that which I will then use as a tiling sprite.
	 * the tiling sprite will be behind the dynamic elements and will just scroll
	 * acording to the camera position.
	 *
	 * The camera position will have bounds set according to the size of the
	 * level canvas.
	 *
	 * For the dynamic elements I'm thinking maybe place them all in a container
	 * and draw them using the true map coordinates and then just move the container
	 * so that the player is in the middle.  The first problem I can think of is
	 * what would be the best way to make sure only relevant sprites are being drawn?
	 * That shouldn't be too difficult as the only sprites that should be drawn are
	 * the player, bullets and enemies (and maybe any moving postions of the map).
	 *
	 * first step is deal with the level, then do the player and worry about the 
	 * other stuff (which doesn't exist right now) later.
	 */
	this.sketch_pad.width  = level_struct.levelmap_width;
	this.sketch_pad.height = level_struct.levelmap_height;

	this.viewport_bound.x = (level_struct.levelmap_width)  - this.viewport.x;
	this.viewport_bound.y = (level_struct.levelmap_height) - this.viewport.y;

	//var level_start;
	//Here you should loop through the existing level sprites and delete them
	//before destroying the references to them
	this.level_sprites = [];
	this.collision_map = [];
	this.basic_enemies = [];
	//var tmp_enemy = null;
	//var sc = 0;
	var ls,la;
	for(var i=0;i<level_struct.level_sprites.length;i++)
	{
		ls = level_struct.level_sprites[i];
		la = level_struct.assets[ls.asset];
		this.sketch_ctx.drawImage(this.textures[la.image].image,ls.x,ls.y);
		if(la.collide)
		{
			//this.sketch_ctx.drawImage(la.image,ls.x,ls.y);

			if(this.collision_map[ls.i] == null)
			{
				this.collision_map[ls.i] = [];
			}
			this.collision_map[ls.i][ls.j] = 
			{
				top:	ls.x+la.col_left,
				bottom: ls.y+la.col_height,
				left:	ls.y+la.col_top,
				right:	ls.x+la.col_width,
				type:	la.col_type
			}
		}
	}
	//THE WALLS ARE SORTED NoW TIME TO WORK ON THE ENEMIES
	for(var i=0;i<level_struct.basic_enemies.length;i++)
	{
		lb = level_struct.basic_enemies[i];
		la = level_struct.assets[lb.asset];
		var tmp_enemy = 
		{
			x		:	lb.x,
			y		:	lb.y,
			left_bound	:	lb.left_bound,
			right_bound	:	lb.right_bound,
			box_width	:	lb.box_width,
			box_height	:	lb.box_height,
			direction	:	lb.direction,
			sprite		:	new PIXI.Sprite(this.txt_basic_enemy)
		};
		tmp_enemy.sprite.anchor.x = 0.5;
		tmp_enemy.sprite.anchor.y = 0.5;
		tmp_enemy.sprite.position.x = tmp_enemy.x;
		tmp_enemy.sprite.position.y = tmp_enemy.y;
		this.basic_enemies.push(tmp_enemy);
		tmp_enemy = null;
	}
	for(var i=0;i<level_struct.waypoints.length;i++)
	{
		lp = level_struct.waypoints[i];
		switch(lp.type)
		{
			case 'exit':
				if(this.collision_map[lp.i] == null)
				{
					this.collision_map[lp.i] = [];
				}
				this.collision_map[lp.i][lp.j] = 
				{
					start:true
				}
				break;
			default:
				console.log('unknown waypoint type');
		}
	}
	//This is the layer that the user interacts with.  The player is on this level
	this.txt_level_2 = PIXI.Texture.fromImage(this.sketch_pad.toDataURL());
	this.level_tile_2 = new PIXI.extras.TilingSprite(this.txt_level_2,this.viewport.x,this.viewport.y);
	//level_tile_2.tilePosition.y = -120;
	this.stage.addChild(this.level_tile_2);
	//console.log(level_struct)
	return(level_struct.level_start);
}

Platform.prototype.map_to_struct = function(image)
{
        this.levelmap.width  = image.width;
        this.levelmap.height = image.height;
        this.levelctx.drawImage(image, 0, 0);
        this.leveldata = this.levelctx.getImageData(0,0,image.width,image.height);

	var tmp_struct =
	{
		levelmap_width	:	parseInt(image.width*24),
		levelmap_height	:	parseInt(image.height*24),
		level_sprites	:	[],
		collision_map	:	[],
		basic_enemies	:	[],
		assets		:	[],
		waypoints	:	[],
		level_start	:	null
	}

	var asset_list = 
	{
		basic_brick	:
		{
			image		:	'basicbrick.png',
			collide		:	true,
			col_type	:	'wall',
			block		:	true,
			col_top		:	0,
			col_left	:	0,
			col_width	:	24,
			col_height	:	24
		},
		basic_enemy	:
		{
			image		:	'basic_enemy.png',
			collide		:	true,
			col_type	:	'basic_enemy',
			block		:	true,
			col_top		:	0,
			col_left	:	0,
			col_width	:	12,
			col_height	:	24
		},
		ladder		:
		{
			image		:	'ladder.png',
			collide		:	true,
			col_type	:	'ladder',
			block		:	false,
			col_top		:	0,
			col_left	:	11,
			col_width	:	2,
			col_height	:	24
		}
	};
	var tmp_enemy = null;
	var sc = 0;
	var red,green,blue;
	for(var j=0;j<image.height;j++)
	{
		for(var i=0;i<image.width;i++)
		{
			if(i >= 0 && j >= 0 && i < image.width && j < image.height)
			{
				red   = this.leveldata.data[4*(i + image.width*j) + 0];
				green = this.leveldata.data[4*(i + image.width*j) + 1];
				blue  = this.leveldata.data[4*(i + image.width*j) + 2];
			}
			if(red == 255)
			{
				if(tmp_enemy == null)
				{
					//basic enemy
					tmp_enemy = 
					{
						asset		:	'basic_enemy',
						x		:	-1,
						y		:	j*24,
						left_bound	:	i*24+12,
						right_bound	:	i*24+12,
						box_width	:	12,
						box_height	:	24,
						direction	:	1
					};
				}
				else
				{
					tmp_enemy.right_bound = i*24+12;
				}
			}
			else if(red != 255 && tmp_enemy != null)
			{
				tmp_enemy.x = tmp_enemy.left_bound+parseInt((tmp_enemy.right_bound - tmp_enemy.left_bound)/2);
				tmp_struct.basic_enemies.push(tmp_enemy);
				if(typeof tmp_struct.assets[tmp_enemy.asset] === 'undefined' || tmp_struct.assets[tmp_enemy.asset] == null)
				{
					tmp_struct.assets[tmp_enemy.asset] = asset_list[tmp_enemy.asset];
				}
				tmp_enemy = null;
			}
			if(green == 255)
			{
				tmp_struct.level_sprites.push(
				{
					asset	:	'basic_brick',
					i	:	i,
					j	:	j,
					x	:	i*24,
					y	:	j*24
				});
				if(typeof tmp_struct.assets['basic_brick'] === 'undefined' || tmp_struct.assets['basic_brick'] == null)
				{
					tmp_struct.assets['basic_brick'] = asset_list['basic_brick'];
				}
			}
			else if(green == 127)
			{
				tmp_struct.level_sprites.push(
				{
					asset	:	'ladder',
					i	:	i,
					j	:	j,
					x	:	i*24,
					y	:	j*24
				});
				if(typeof tmp_struct.assets['ladder'] === 'undefined' || tmp_struct.assets['ladder'] == null)
				{
					tmp_struct.assets['ladder'] = asset_list['ladder'];
				}
			}
			if(blue == 200)
			{
				tmp_struct.level_start = 
				{
					i	:	i,
					j	:	j,
					x	:	i*24,
					y	:	j*24
				};
			}
			else if(blue == 255)
			{
				tmp_struct.waypoints.push(
				{
					type	:	'exit',
					i	:	i,
					j	:	j,
					x	:	i*24,
					y	:	j*24
				});
			}
		}
	}
	return(tmp_struct);
}

Platform.prototype.draw_backgrounds = function()
{
	//This is just temporary as I don't have a background to add
	//clear out the sketch canvas and use it as a background
	this.sketch_pad.width = this.sketch_pad.width;

	this.txt_level_4 = PIXI.Texture.fromImage(this.sketch_pad.toDataURL());
	this.level_tile_4 = new PIXI.extras.TilingSprite(this.txt_level_4,this.viewport.x,this.viewport.y);
	this.stage.addChild(this.level_tile_4);

	this.txt_level_3 = PIXI.Texture.fromImage(this.sketch_pad.toDataURL());
	this.level_tile_3 = new PIXI.extras.TilingSprite(this.txt_level_3,this.viewport.x,this.viewport.y);
	this.stage.addChild(this.level_tile_3);
}

Platform.prototype.draw_foreground = function()
{
	//This is just temporary as I don't have a foreground to add
	//clear out the sketch canvas and use it as a foreground
	this.sketch_pad.width = this.sketch_pad.width;

	this.txt_level_1 = PIXI.Texture.fromImage(this.sketch_pad.toDataURL());
	this.level_tile_1 = new PIXI.extras.TilingSprite(this.txt_level_1,this.viewport.x,this.viewport.y);
	this.stage.addChild(this.level_tile_1);

	this.txt_level_0 = PIXI.Texture.fromImage(this.sketch_pad.toDataURL());
	this.level_tile_0 = new PIXI.extras.TilingSprite(this.txt_level_0,this.viewport.x,this.viewport.y);
	this.stage.addChild(this.level_tile_0);
}

Platform.prototype.get_level_data_point = function(x,y,c)
{
	if(x >= 0 && y >= 0 && x < this.levelmap_width && y < this.levelmap_height && c >=0 && c < 4)
	{
		return(this.leveldata.data[4*(x + this.levelmap_width*y) + c]);
	}
	return(-1);
}

Platform.prototype.keyhandler = function(event,type)
{
	switch(event.which)
	{
		//up: 	38
		case 38:
			event.preventDefault();
			if(type == 'keydown')
			{
				this.key_reg.up = true;
				this.ladder_motion = -1;
			}
			else if(type == 'keyup')
			{
				this.key_reg.up = false;
				this.ladder_motion = 0;
			}
			break;
		//down:	40
		case 40:
			event.preventDefault();
			if(type == 'keydown')
			{
				this.key_reg.down = true;
				this.ladder_motion = 1;
				if(!this.on_ladder)
				{
					this.duck = true;
					this.spt_dummy.texture = this.txt_dummy_duck;
				}

			}
			else if(type == 'keyup')
			{
				this.key_reg.down = false;
				this.ladder_motion = 0;
				this.duck = false;
				this.spt_dummy.texture = this.txt_dummy;
			}
			break;
		//left:	37
		case 37:
			event.preventDefault();
			if(type == 'keydown')
			{
				this.key_reg.left = true;
				this.current_h_direction = -1;
				this.going = -1;
			}
			else if(type == 'keyup')
			{
				this.key_reg.left = false;
				if(this.going == -1)
				{
					this.going = 0;
				}
			}
			break;
		//right:39
		case 39:
			event.preventDefault();
			if(type == 'keydown')
			{
				this.key_reg.right = true;
				this.current_h_direction = 1;
				this.going = 1;
			}
			else if(type == 'keyup')
			{
				this.key_reg.right = false;
				if(this.going == 1)
				{
					this.going = 0;
				}
			}
			break;
		//space:32
		case 32:
			event.preventDefault();
			if(type == 'keydown' && !this.keystates[32])
			{
				this.key_reg.jump = true;
				this.keystates[32] = true;
				if(!this.duck)
				{
					this.jump();
				}
			}
			else if(type == 'keyup')
			{
				this.key_reg.jump = false;
				this.keystates[32] = false;
				if(this.varijump)
				{
					this.jumptime = false;
				}
			}
			break;
		case 16:
			event.preventDefault();
			if(type == 'keydown')
			{
				this.key_reg.run = true;
				this.max_speed = this.high_speed;
			}
			else if(type == 'keyup')
			{
				this.key_reg.run = false;
				this.max_speed = this.low_speed;
			}
			break;

		//d:68
		case 68:
			event.preventDefault();
			if(type == 'keydown')
			{
				this.key_reg.shoot = true;
				this.shoot();
			}
			else if(type == 'keyup')
			{
				this.key_reg.shoot = false;
			}
			break;

		default:
			console.log('Key was: ',event.which,event);

	}
}

Platform.prototype.shoot = function()
{
	if(this.bullets.length > 0)
	{
		var t_bull = this.bullets.pop();
		t_bull.rotation = (this.current_h_direction == 1?0:Math.PI);
		t_bull.position.x = this.spt_dummy.position.x+(this.current_h_direction==1?24:0);
		t_bull.position.y = this.spt_dummy.position.y+24;
		t_bull.visible = true;
		this.flying_bullets.push(
		{
			direction:	this.current_h_direction,
			bullet:		t_bull,
		});
	}

}

Platform.prototype.jump = function(jumpup)
{
	var jump_thresh = 5;
	if(jumpup != null && jumpup < jump_thresh)
	{
		if(this.jumping && this.v_speed < 0)
		{
			this.v_speed = Math.abs(((jump_thresh - jumpup)/jump_thresh)*this.jumpspeed);
		}
	}
	else
	{
		if(!this.jumping)
		{
			this.jumping = true;
			this.peak = false;
			if(this.varijump)
			{
				this.v_speed = 0;
				this.jumptime = true;
			}
			else
			{
				this.v_speed = this.jumpspeed;
			}
			this.v_drop = 0;
			//walljumped = false;
			this.walljump = false;
			this.last_walljump_dir = 0;
			//wall_jump_hit = false;
		}
		else if(this.jumping)
		{
			if(this.dbljump && !this.peak)
			{
				this.peak = true;
				//v_speed = jumpspeed;
				this.v_speed = 0;
				if(this.varijump)
				{
					this.v_speed = 0;
					this.jumptime = true;
				}
				else
				{
					this.v_speed = this.jumpspeed;
				}
			}
			else if(this.walljump && this.walljump_dir != this.last_walljump_dir)
			{
				this.last_walljump_dir = this.walljump_dir;
				this.wall_jump_frames = 0;
				if(this.varijump)
				{
					this.v_speed = 0;
					this.jumptime = true;
				}
				else
				{
					this.v_speed = this.jumpspeed;
				}
				this.v_speed = 0;
				this.v_drop = 0;
			}
		}
	}
}

Platform.prototype.new_vertical_speed = function(x,y)
{
	var crash = false;

	var oldspeed = this.v_speed;

	if(!this.on_ladder)
	{
		if(this.v_speed < this.max_drop)
		{
			this.v_speed += this.acc;
		}
		if(this.v_speed > this.max_drop)
		{
			this.v_speed = this.max_drop;
		}
	}
	else
	{
		this.v_speed = this.ladder_motion*this.ladder_climb;
	}
	var new_speed = this.v_speed;
	var new_pos_x = x;
	var new_pos_y = y+this.v_speed;
	var col = this.test_collision(new_pos_x,new_pos_y,'player');
	if(col.collision)
	{
		if(col.ladder)
		{
			if(this.on_ladder)
			{
				if(col.collision_type == 'wall')
				{
					if(this.ladder_motion > 0)
					{
						var shim = 24 - Math.abs(this.spt_dummy.position.y % 24);
						if(shim != 24)
						{
							this.v_speed = shim;
						}
						else
						{
							this.v_speed = 0;
						}
					}
					else if(this.ladder_motion < 0)
					{
						var shim = Math.abs(this.spt_dummy.position.y % 24);
						if(shim != 0)
						{
							this.v_speed = -shim;
						}
						else
						{
							this.v_speed = 0;
						}
					}
				}
				else if(col.collision_type == 'basic_enemy')
				{
					this.stage_level(this.current_level);
				}
			}
			else
			{
				this.v_speed = 0;
				this.on_ladder = true;
			}
		}
		else if(col.collision_type == 'wall')
		{
			if(this.on_ladder)
			{
				this.v_speed = 0;
			}
			this.on_ladder = false;
			if(this.v_speed > 0)
			{
				this.jumping = false;
				if(this.v_drop > this.max_v_drop)
				{
					this.stage_level(this.current_level);
				}
				this.v_speed = 0;
				this.v_drop = 0;
			}
			else
			{
				this.peak = true;
				this.v_speed = this.acc;
				this.v_drop = this.acc;
				this.jumptime = false;
			}
		}
		else if(col.collision_type == 'basic_enemy')
		{
			this.on_ladder = false;
			this.stage_level(this.current_level);
		}
		else
		{
			this.on_ladder = false;
		}
	}
	else
	{
		//debounce the player at the top of the ladder
		if(this.on_ladder && this.ladder_motion == -1)
		{
			var shim = 24 - Math.abs((this.spt_dummy.position.y+this.v_speed) % 24);
			if(shim != 24)
			{
				this.v_speed += shim;
			}
		}
		this.on_ladder = false;
		this.v_drop += this.v_speed;
		if(oldspeed < 0 && this.v_speed >= 0)
		{
			this.peak = true;
		}
	}
	if(col.collision_type == 'wall' && this.key_reg.down && new_speed > 0)
	{
		this.on_ladder = false;
		this.duck = true;
		this.spt_dummy.texture = this.txt_dummy_duck;
	}
	else
	{
		this.duck = false;
		this.spt_dummy.texture = this.txt_dummy;
	}
}


Platform.prototype.new_horizontal_speed = function(x,y)
{
	var final_speed = (this.duck?this.crawl_speed:this.max_speed);
	if(this.on_ladder)
	{
		this.h_speed = this.going*final_speed;
	}
    	else if(this.going != 0)
    	{
	    	if(this.going > 0)
	    	{
			if(this.h_speed < 0)
			{
				this.h_speed += this.dec;
			}
		    	else if(this.h_speed < final_speed)
		    	{
			   	this.h_speed += this.acc;
		    	}
		    	if(this.h_speed > final_speed)
		    	{
				this.h_speed = final_speed;
		    	}
	    	}
	    	else if(this.going < 0)
	    	{
			if(this.h_speed > 0)
			{
		   		this.h_speed -= this.dec;
			}
		    	else if(this.h_speed > -final_speed)
		    	{
		   		this.h_speed -= this.acc;
		    	}
		    	if(this.h_speed < -final_speed)
		    	{
		  		this.h_speed = -final_speed;
		    	}
	    	}
    	}
    	else if (this.h_speed != 0)
    	{
	    	if(this.h_speed < 0)
	    	{
		    	this.h_speed += (this.jumping?this.air_dec:this.dec);
		    	if(this.h_speed > 0)
		    	{
			    	this.h_speed = 0;
		    	}
	    	}
	    	else
	    	{
		    	this.h_speed -= (this.jumping?this.air_dec:this.dec);
		    	if(this.h_speed < 0)
		    	{
			    	this.h_speed = 0;
		    	}
	    	}
    	}
	var col = this.test_collision(x+this.h_speed,y,'player');
	if(col.collision && col.blocker == true)
	{
		switch(col.collision_type)
		{
			case 'wall':
				this.on_ladder = false;
				if(this.h_speed > 0)
				{
					if(this.last_walljump_dir <= 0)
					{
						this.walljump = true;
						this.walljumpx = x;
						this.walljump_dir = 1;
					}
				}
				else
				{
					if(this.last_walljump_dir >= 0)
					{
						this.walljump = true;
						this.walljumpx = x;
						this.walljump_dir = -1;
					}
				}
				//if(!this.walljumped)
				//{
					//this.walljump = true;
					//this.walljumpx = x;
				//}
				this.h_speed = 0;
				break;
			case 'basic_enemy':
				this.stage_level(this.current_level);
				break;
		}
	}
	else if(this.walljump && this.walljump_dir != this.last_walljump_dir && Math.abs(this.walljumpx - x) < 10)
	{
		this.walljump = true;
	}
	else
	{
		this.walljump = false;
	}
}

Platform.prototype.test_collision = function(x,y,who)
{
	var top_left;
	var top_right;
	var bottom_left;
	var bottom_right;
	var center_x;
	var center_y;
	var box_width;
	var box_height;

	var ret_val =
	{
		collision_type:'',
		collision:false,
		collision_index:-1,
		blocker:false,
		ladder:false
	}
	switch(who)
	{
		case 'player':
			if(this.duck)
			{
				top_left = {x:Math.floor((x-12)/24),y:Math.floor((y+24)/24)};
				top_right = {x:Math.ceil(((x-12)/24)+1),y:top_left.y};
				bottom_left = {x:top_left.x,y:Math.ceil((y/24)+2)};
				bottom_right = {x:top_right.x,y:bottom_left.y};
				center_x = x+12;
				center_y = y+24;
				box_width = 12;
				box_height = 24;
			}
			else
			{
				top_left = {x:Math.floor((x-12)/24),y:Math.floor(y/24)};
				top_right = {x:Math.ceil((x-12)/24+1),y:top_left.y};
				bottom_left = {x:top_left.x,y:Math.ceil(y/24+2)};
				bottom_right = {x:top_right.x,y:bottom_left.y};
				center_x = x+12;
				center_y = y+36;
				box_width = 12;
				box_height = 12;
			}
			break;
		case 'bullet':
				top_left = {x:Math.floor((x-3)/24),y:Math.floor((y-1)/24)};
				top_right = {x:Math.ceil((x+3)/24),y:top_left.y};
				bottom_left = {x:top_left.x,y:Math.ceil((y+1)/24)};
				bottom_right = {x:top_right.x,y:bottom_left.y};
				center_x = x;
				center_y = y;
				box_width = 3;
				box_height = 1;
			break;
		default:
			return(ret_val);
	}
	for(var j=top_left.y;j<bottom_left.y;j++)
	{
		for(var i=top_left.x;i<top_right.x;i++)
		{
			if(this.collision_map[i] != null && this.collision_map[i][j] != null)
			{
				if(this.collision_map[i][j].start != null)
				{
					this.current_level++;
					if(this.current_level>=this.levels.length)
					{
						this.current_level = 0;
					}
					this.stage_level(this.current_level);
				}
				else
				{
					ret_val.collision = true;
					switch(this.collision_map[i][j].type)
					{
						case 'ladder':
							ret_val.ladder = true;
							break;
						case 'wall':
							ret_val.collision_type = 'wall';
							ret_val.blocker = true;
							//return(ret_val);
							break;
						default:
							ret_val.collision_type = 'wall';
							ret_val.blocker = true;
							//return(ret_val);
					}
				}
			}
		}
	}
	if(ret_val.blocker)
	{
		return(ret_val);
	}
	for(var i=0;i<this.basic_enemies.length;i++)
	{
		if(Math.abs(center_x - this.basic_enemies[i].sprite.position.x) <= box_width + this.basic_enemies[i].box_width)
		{
			if(Math.abs(center_y - this.basic_enemies[i].sprite.position.y) <= box_height + this.basic_enemies[i].box_height)
			{
				ret_val.collision = true;
				ret_val.collision_type = 'basic_enemy';
				ret_val.blocker = true;
				ret_val.collision_index = i;
				return(ret_val);
			}
		}
	}
	return(ret_val);
}
