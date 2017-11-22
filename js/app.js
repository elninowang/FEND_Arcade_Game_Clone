const BLOCK_WIDTH = 101;  // 地图上每一方块的宽度
const BLOCK_HEIGHT = 83;  // 地图上每一方块的宽度
const CANVAS_X = 0        // 地图左上角在 canvas 上的x坐标
const CANVAS_Y = 50;      // 地图右上角在 canvas 上的x坐标

/**
 * 精灵基类，玩家和敌人都继承于此类
 */
class Sprite {
    constructor() {
        this.x = 0;                    // 精灵的左上角对地图左上角的 x坐标
        this.y = 0;                    // 精灵的左上角对地图左上角的 y坐标
        this.width = 0;                // 精灵的x轴 实际宽度
        this.height = 0;               // 精灵的y轴 实际宽度
        this.rectification_x = 0;      // 精灵的实际左上角相对于精灵图片左上角的 x坐标
        this.rectification_y = 0;      // 精灵的实际左上角相对于精灵图片左上角的 y坐标
    }

    /**
     * 此为游戏必须的函数，用来更新敌人的位置
     * @param {float} dt 表示于上次更新的时间间隙，单位秒
     */
    update(dt) {
    }

    /**
     * 此为游戏必须的函数，用来在屏幕上画出敌人
     *  注意，要做坐标变换
     */
    render() {
        ctx.drawImage(Resources.get(this.sprite), 
            CANVAS_X+this.x-this.rectification_x, 
            CANVAS_Y+this.y-this.rectification_y);
        // 以下代码是用于调试，检查碰撞边界和精灵是否一致
        // ctx.strokeRect(CANVAS_X+this.x, CANVAS_Y+this.y, 
        //     this.width, this.height);
    }

    /**
     * 检查精灵是否和其他精灵发生碰撞
     * @param {Sprite} sprite 判断碰撞的精灵
     * @return {bool} true表示碰撞，false表示不碰撞 
     */
    checkCollisions(sprite) {
        if (this.x   + this.width    > sprite.x &&
            sprite.x + sprite.width  > this.x   &&
            this.y   + this.height   > sprite.y &&
            sprite.y + sprite.height > this.y
           ) {
            return true;
        } else {
            return false;
        }
    }
}
/**
 * 这是我们的玩家要躲避的敌人 
 */
class Enemy extends Sprite {
    constructor() {
        super();
        // 敌人的图片或者雪碧图，用一个我们提供的工具函数来轻松的加载文件
        this.sprite = 'images/enemy-bug.png';
        this.rectification_x = 2;
        this.rectification_y = 78;
        this.width = 98;
        this.height = 66;
        this.reset();
    }

    /**
     * 敌人的位置参数重置，重新随机生成
     */
    reset() {
        this.speed = 100 + Math.random()*500;
        this.row = Math.floor(1 + Math.random()*3);
        this.x =  -BLOCK_WIDTH;
    }

    /**
     * 敌人的位置更新，继承自基类
     * @param {float} dt 表示于上次更新的时间间隙，单位秒
     */
    update(dt) {
        this.x += this.speed * dt + (BLOCK_WIDTH-this.width)/2;
        this.y = BLOCK_HEIGHT * this.row + (BLOCK_HEIGHT-this.height)/2;
        // 移出了边界，将从左边再次进来
        if (this.x > BLOCK_WIDTH*6) {
            this.reset();
        }
    }
}

/**
 * 玩家
 */
class Player extends Sprite {
    constructor() {
        super();
        this.rectification_x = 16;
        this.rectification_y = 62;
        this.width = 68;
        this.height = 78;
        this.sprite = 'images/char-boy.png';
        this.score = 0;
        this.reset();
    }

    /**
     * 玩家的位置更新，继承自基类
     * @param {float} dt 表示于上次更新的时间间隙，单位秒
     */
    update(dt) {
        this.x = BLOCK_WIDTH * this.col + (BLOCK_WIDTH-this.width)/2;
        this.y = BLOCK_HEIGHT * this.row + (BLOCK_HEIGHT-this.height)/2;

        // 发生玩家和敌人发生了碰撞，就会死去从而重置
        for (let enemy of allEnemies) {
            if (enemy.checkCollisions(this)) {
                console.log("collised enemy");
                this.reset();
                this.score -= 5000;
                if (this.score < 0) this.score = 0;
                break;
            }
        }

        // 发生玩家和砖石发生了碰撞，就会吃下砖石
        for (let gem of allGems) {
            if (gem.is_received == false && gem.checkCollisions(this)) {
                console.log("collised gem");
                gem.is_received = true;
                console.log("gem.score = " + gem.score);
                this.score = this.score + gem.score;
                console.log("score = " + this.score);
                break;
            }
        }
    }

    render() {
        super.render();
        // 输出分数
        ctx.font = "45px 隶书";  
        ctx.fillStyle = "Green"; 
        ctx.clearRect(0,0,550,50);
        ctx.fillText(`你的分数 : ${this.score}`,0,40);
    }
    
    /**
     * 接受键盘事件
     * @param {String} keyCode 用下按下了哪个按键 
     */
    handleInput(keyCode) {
        const MAX_ROW = 5;
        const MAX_COL = 4;
        if (keyCode == "up") {
            this.row --;
        } else if (keyCode == "down") {
            this.row ++;
        } else if (keyCode == "left") {
            this.col --;
        } else if (keyCode == "right") {
            this.col ++;
        }
        // 玩家不能走出地图边界
        if (this.row < 0) this.row = 0;
        if (this.row > MAX_ROW) this.row = MAX_ROW;
        if (this.col < 0) this.col = 0;
        if (this.col > MAX_COL) this.col = MAX_COL;

        // 判端游戏是否胜利
        if (this.row == 0) {
            // 游戏胜利
            console.log("win");
            $('#player-img').attr("src", this.sprite);
            $('#player-img').addClass('animated rubberBand');
            $('#player-score').text($('#player-score').text().replace('#{score}', `${this.score}`));
            $('#game-success').addClass("fullScreen");
        }
    }

    /**
     * 重置玩家，玩家死亡之后也会通过此方法重置
     */
    reset() {
        this.row = 5;
        this.col = 2;
    }
}

/**
 * 砖石类
 */
class Gem extends Sprite {
    constructor(row, col, score) {
        super();
        this.rectification_x = 4/2;
        this.rectification_y = 58/2;
        this.width = 90/2;
        this.height = 106/2;
        this.row = row;
        this.col = col;
        this.score = score;
        this.is_received = false;  // 是否已经被玩家手下
    }

    update(dt) {
        this.x = BLOCK_WIDTH * this.col + (BLOCK_WIDTH-this.width)/2;
        this.y = BLOCK_HEIGHT * this.row + (BLOCK_HEIGHT-this.height)/2;
    }

   render() {
       console.log("gem rendered");
       if (this.is_received == false) {
           super.render();
       }
   }
}

/**
 * 蓝砖石，分数最低
 */
class BlueGem extends Gem {
    constructor(row, col) {
        super(row, col, 1000);
        this.sprite = "images/Gem Blue.png";
    }

}

/**
 * 绿砖石，分数居中
 */
class GreenGem extends Gem {
    constructor(row, col) {
        super(row, col, 2000);
        this.sprite = "images/Gem Green.png";
    }
}

/**
 * 橙色砖石，分数最高
 */
class OrangeGem extends Gem {
    constructor(row, col) {
        super(row, col, 5000);
        this.sprite = "images/Gem Orange.png";
    }
}

// 现在实例化你的所有对象
// 把所有敌人的对象都放进一个叫 allEnemies 的数组里面
allEnemies = [new Enemy(),new Enemy(),new Enemy()];
// 把所有砖石的对象都放进一个叫 allGems 的数组里面
allGems = [ new GreenGem(3,3), new GreenGem(2,2), new OrangeGem(1,1),
            new BlueGem(4,0), new BlueGem(4,4) ];
            // 把玩家对象放进一个叫 player 的变量里面
player = new Player();

// 这段代码监听游戏玩家的键盘点击事件并且代表将按键的关键数字送到 Play.handleInput()
// 方法里面。你不需要再更改这段代码了。
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
