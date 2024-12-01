const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'phaser-example',
        width: '100%',
        height: '100%'
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    }
};

const game = new Phaser.Game(config);

let player;
let enemies;
let powerUps;
let keys;
let score = 0;
let scoreText;
let playerPowerLevel = 0;
let playerPowerText;

function preload() {
    this.load.svg('background', 'assets/fantasy_forest_map.svg');
    this.load.svg('player', 'assets/knight.svg');
    this.load.svg('dragon', 'assets/dragon.svg');
    this.load.svg('orc', 'assets/orc.svg');
    this.load.svg('yeti', 'assets/yeti.svg');
    this.load.svg('powerup', 'assets/treasure_chest.svg');
}

function create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width/2, height/2, 'background').setDisplaySize(width, height);

    player = this.physics.add.sprite(0, 0, 'player');
    player.setCollideWorldBounds(true);
    player.setScale(0.5);

    randomSpawn.call(this, player);

    enemies = this.physics.add.group();
    powerUps = this.physics.add.group();

    keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
    playerPowerText = this.add.text(16, 56, `Player Power: ${playerPowerLevel}`, { fontSize: '18px', fill: '#fff' });

    this.time.addEvent({
        delay: 1000,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });

    this.time.addEvent({
        delay: 5000,
        callback: spawnPowerUp,
        callbackScope: this,
        loop: true
    });

    this.physics.add.collider(player, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);
}

function update() {
    if (keys.left.isDown) {
        player.setVelocityX(-160);
    } else if (keys.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    if (keys.up.isDown) {
        player.setVelocityY(-160);
    } else if (keys.down.isDown) {
        player.setVelocityY(160);
    } else {
        player.setVelocityY(0);
    }

    enemies.getChildren().forEach(enemy => {
        enemy.powerText.setPosition(enemy.x, enemy.y - 20);
    });
}

function randomSpawn(item) {
    const x = Phaser.Math.Between(50, this.scale.width - 50);
    const y = Phaser.Math.Between(50, this.scale.height - 50);
    item.setPosition(x, y);
}

function spawnEnemy() {
    const enemyTypes = ['dragon', 'orc', 'yeti'];
    const enemyType = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];
    const enemy = enemies.create(0, 0, enemyType);
    randomSpawn.call(this, enemy);
    
    const std_dev = 5;
    let enemyPower = Math.round(gaussianRandom(playerPowerLevel, std_dev));
    enemy.powerLevel = Math.max(enemyPower, 1); // Ensure power level is at least 1
    
    //enemy.setScale(Math.max(.01, 0.3 + (enemy.powerLevel * 0.05)));
    this.physics.moveToObject(enemy, player, 80 + enemy.powerLevel * 10);

    enemy.powerText = this.add.text(enemy.x, enemy.y - 20, `Power: ${enemy.powerLevel}`, { fontSize: '16px', fill: '#ffffff' });
    enemy.powerText.setOrigin(0.5);
}

function spawnPowerUp() {
    const powerUp = powerUps.create(0, 0, 'powerup');
    randomSpawn.call(this, powerUp);
    powerUp.setScale(0.3);
}

function gaussianRandom(mean, std_dev) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return num * std_dev + mean;
}

function evaluateCombat(playerPower, enemyPower) {
    if (playerPower > enemyPower) {
        return 'player wins';
    } else if (enemyPower > playerPower) {
        return 'enemy wins';
    } else {
        return 'tie';
    }
}

function respawnPlayer() {
    randomSpawn.call(this, player);
    playerPowerLevel = Math.max(0, playerPowerLevel - 2);  // Lose some power, but not below 0
    updatePlayerPowerDisplay();
}

function hitEnemy(player, enemy) {
    let combatResult = evaluateCombat(playerPowerLevel, enemy.powerLevel);
    
    if (combatResult === 'player wins') {
        enemy.powerText.destroy();
        enemy.disableBody(true, true);
        score += enemy.powerLevel * 10;
        playerPowerLevel += 1;
    } else if (combatResult === 'enemy wins') {
        respawnPlayer.call(this);
    }
    // If it's a tie, nothing happens

    scoreText.setText('Score: ' + score);
    updatePlayerPowerDisplay();
}

function collectPowerUp(player, powerUp) {
    powerUp.disableBody(true, true);
    score += 50;
    scoreText.setText('Score: ' + score);
    playerPowerLevel += 5;
    updatePlayerPowerDisplay();
}

function updatePlayerPowerDisplay() {
    playerPowerText.setText(`Player Power: ${playerPowerLevel}`);
}