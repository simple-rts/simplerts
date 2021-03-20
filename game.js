// @ts-check
/// <reference path="./p5.global-mode.d.ts" />
"use strict";

let entities;
let selectedUnits;

let gm;

let simulationPaused;
let pausePlayBtn;
let advanceOneStepBtn;

function advanceOneStepSimulation() {
    if (simulationPaused === true) {
        redraw();
    }
}

function pauseSimulation() {
    noLoop();
    simulationPaused = true;
    pausePlayBtn.html("Play");
    advanceOneStepBtn.show();
}

function resumeSimulation() {
    loop();
    simulationPaused = false;
    pausePlayBtn.html("Pause");
    advanceOneStepBtn.hide();
}

function pausePlaySimulation() {
    if (simulationPaused === false) {
        pauseSimulation();
    } else {
        resumeSimulation();
    }
}

// initialization
function setup() {
    createCanvas(800, 600);

    gm = new GameManager();

    // World

    entities = new EntityGroup();

    // initial set of units
    let s = 100;
    for (let i = 0; i < 5; i++) {
        let x = width / 3 * 2 + random(- s, s);
        let y = height / 3 * 2 + random(- s, s);
        let u = new Unit(x, y, playersEnum.you);
        entities.addEntity(u);
    }

    // enemies
    s = 200;
    for (let i = 0; i < 5; i++) {
        let x = width / 3 + random(- s, s);
        let y = height / 3 + random(- s, s);
        let u = new Unit(x, y, playersEnum.enemy);
        entities.addEntity(u);
    }

    selectedUnits = new EntityGroup();

    s = 300;
    for (let i = 0; i < 2; i++) {
        let x = width / 3 * 2 + random(- s, s);
        let y = height / 3 * 2 + random(- s, s);
        let b = new Barracks(x, y, playersEnum.you);
        entities.addEntity(b);
    }
    for (let i = 0; i < 2; i++) {
        let x = width / 3 + random(- s, s);
        let y = height / 3 + random(- s, s);
        let b = new Barracks(x, y, playersEnum.enemy);
        entities.addEntity(b);
    }

    s = 400;
    for (let i = 0; i < 5; i++) {
        let x = width / 2 + random(- s, s);
        let y = height / 2 + random(- s, s);
        let n = new ResourceNode(x, y);
        entities.addEntity(n);
    }

    // UI

    simulationPaused = false;

    pausePlayBtn = createButton("Pause");
    // @ts-ignore
    pausePlayBtn.position(width / 2, 0);
    // @ts-ignore
    pausePlayBtn.mousePressed(pausePlaySimulation);

    advanceOneStepBtn = createButton("Step");
    // @ts-ignore
    advanceOneStepBtn.position(width / 2 + 50, 0);
    // @ts-ignore
    advanceOneStepBtn.hide();
}

let mouseDown = false;
let startSelection;

// ugly sync sleep function (javascript doesn't have
// a normaly sync sleep)
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

// called every frame. body of our game loop
function draw() {
    background(51);

    // slow down the game loop. 
    // TODO replace with skip-frame logic to modulate fps
    // sleep(100);

    for (let i = 0; i < entities.length; i++) {
        entities._entities[i].update();
        entities._entities[i].render();
    }

    // do deferred actions

    // destroy entities that are to be destroyed
    for (let i = 0; i < gm.entitiesToDestroyAtEndOfFrame.length; i++) {
        const entity = gm.entitiesToDestroyAtEndOfFrame[i];
        entity.dead = true;
    }
    entities._entities = entities._entities
        .filter(e => ! gm.entitiesToDestroyAtEndOfFrame.includes(e));
    // reset
    gm.entitiesToDestroyAtEndOfFrame = [];

    // spawning entities that are to be spawned
    for (let i = 0; i < gm.entitiesToSpawnAtEndOfFrame.length; i++) {
        const e = gm.entitiesToSpawnAtEndOfFrame[i];
        entities.addEntity(e);
    }
    gm.entitiesToSpawnAtEndOfFrame = [];

    // selection rectangle
    if (mouseDown) {
        push();
        noFill();
        stroke(color(0, 255, 0));
        rect(startSelection.x, startSelection.y, mouseX - startSelection.x, mouseY - startSelection.y);
        pop();
    }
}

const mouseButtons = Object.freeze({LMB: 0, RMB: 2})

function mousePressed(event) { 
    // console.log(event);
    if (event.button === mouseButtons.LMB) {
        mouseDown = true;
        startSelection = createVector(mouseX, mouseY);
    }
}

// prevent opening context menu on browser when using RMB
// (otherwise we can't use RMB to provide game input)
// https://stackoverflow.com/questions/60853612/p5-js-on-right-mouse-click-shows-the-browser-context-menu-and-not-the-drawing-fu
document.addEventListener('contextmenu', event => event.preventDefault());

function mouseReleased(event) {
    // console.log(event);

    // selection
    if (event.button === mouseButtons.LMB) { 
        // stop selecting
        mouseDown = false;

        // select units
        selectedUnits.empty();
        allUnits().forEach(u => {
            if ((u.owner == playersEnum.you) && pointInRect(u.position.x, u.position.y, startSelection.x, startSelection.y, mouseX, mouseY)) {
                selectedUnits.addEntity(u);
                u.selected = true;
            } else {
                u.selected = false;
            }
        });
    }

    // commands (RMB)
    // @ts-ignore
    if (event.button === mouseButtons.RMB) {
        // @ts-ignore
        selectedUnits._entities
            .forEach(u => {
                u.moveTo(mouseX, mouseY);    
            });
    }
}

// get all units in game
function allUnits() {
    return entities._entities.filter((e) => e instanceof Unit);
}

// Add a new boid into the System
function mouseDragged() { // flock.addBoid(new Boid(mouseX, mouseY));
}

/**
 * @param {number} px
 * @param {number} py
 * @param {number} bx1
 * @param {number} by1
 * @param {number} bx2
 * @param {number} by2
 */
function pointInRect(px, py, bx1, by1, bx2, by2) {
    return (px > min(bx1, bx2)) && (px < max(bx1, bx2)) && 
        (py > min(by1, by2)) && (py < max(by1, by2))
}

// singleton to manage global stuff
class GameManager {
    constructor() {
        this.entitiesToDestroyAtEndOfFrame = [];
        this.entitiesToSpawnAtEndOfFrame = [];
        this.mq = new MQ();
    }
    /**
     * @param {Entity} e
     */
    destroy(e) {
        this.entitiesToDestroyAtEndOfFrame.push(e);
    }
    /**
     * @param {Entity} e
     */
    spawn(e) {
        this.entitiesToSpawnAtEndOfFrame.push(e);
    }
}

// pub-sub message queue
class MQ {
    constructor() {
        this.subscribers = {};
    }
    /**
     * @typedef {number} EventType
     * @enum {EventType}
     */
    static eventTypes = Object.freeze({
        dies: 1
    });
    /**
     * @typedef {number} SubscriptionEnum
     * @enum {SubscriptionEnum}
     */
    static subscriptionEnum = Object.freeze({
        untilUnsubscribe: 1,
        once: 2,
        untilTrue: 3,
    });
    // private method for subscribing (registering callbacks for events
    // that will be published, i.e. which some parts of the code will
    // notify the MQ about)
    /**
     * @param {EventType} eventType
     * @param {(publisher: any, data: any) => ?boolean} callback
     * @param {SubscriptionEnum} subscriptionType
     */
    _subscribe(eventType, callback, subscriptionType) {
        // initialize the array of callbacks for eventName
        if (!Array.isArray(this.subscribers[eventType])) {
            this.subscribers[eventType] = [];
        }
        // add callback to be called once this event fires
        // (when somebody calls `publish(eventName)` with this eventName)
        const index = this.subscribers[eventType].length;
        if (subscriptionType === MQ.subscriptionEnum.untilUnsubscribe) {
            this.subscribers[eventType].push(callback);
            // unsubscribe function, which the subscriber can use later
            return () => this._unsubscribe(eventType, index);
        } else if (subscriptionType === MQ.subscriptionEnum.once) {
            this.subscribers[eventType].push((publisher, data) => {
                // when this runs, it will run the callback and
                // the immediately unsubscribe thereafter
                callback(publisher, data);
                this._unsubscribe(eventType, index);
            })
        } else if (subscriptionType === MQ.subscriptionEnum.untilTrue) {
            this.subscribers[eventType].push((publisher, data) => {
                // when this runs, it will run the callback.
                // then, if that returned true, unsubscribe
                let ret = callback(publisher, data);
                if (ret === true) {
                    this._unsubscribe(eventType, index);
                }
                // TODO return the unsubscribe method in case we
                // want to unsubscribe early? maybe with a param
                // `earlyUnsubscription` we could return it?
            })
        }
    }
    // private method for unsubscribing
    _unsubscribe(eventType, indexOfCallback) {
        // remove callback from place indexOfCallback
        this.subscribers[eventType].splice(indexOfCallback, 1);
    }
    // subscribe until the subscriber unsubscribes
    subscribe(eventType, callback) {
        this._subscribe(eventType, callback, MQ.subscriptionEnum.untilUnsubscribe);
    }   
    // subscribes only once. Will automatically unsubscribe at the
    // first publication event
    subscribeOnce(eventType, callback) {
        this._subscribe(eventType, callback, MQ.subscriptionEnum.once);
    }
    // subscribes until the callback returns true
    // (true = "you can finally unsubscribe me")
    subscribeUntilTrue(eventType, callback) {
        this._subscribe(eventType, callback, MQ.subscriptionEnum.untilTrue);
    }
    publish(eventType, publisher, data) {
        // no one is subscribed
        if (!Array.isArray(this.subscribers[eventType])) {
            return;
        }
        // call all registered callbacks
        this.subscribers[eventType].forEach(callback => {
            callback(publisher, data);
        });
    }
}

// base class for all entities (just for polymorphism in type annotations
// for now).
// TODO go for a more data-oriented entity-component-system?
class Entity {
}

// group of entities
class EntityGroup {
    constructor() {
        this._entities = [];

        // https://javascript.info/property-accessors
        Object.defineProperty(this, 'length', {
            get() {
                return this._entities.length;
            }
        });

        // TODO how to define [] accessors on this class in plain javascript?
    }
    /**
     * @param {Entity} e
     */
    addEntity(e) {
        this._entities.push(e);
    }
    empty() {
        this._entities = [];
    }
}

/**
 * @typedef {number} PlayersEnum
 * @enum {PlayersEnum}
 */
const playersEnum = Object.freeze({"you": 1, "enemy": 2, "neutral": 3})

class Unit extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {PlayersEnum} owner
     */
    constructor(x, y, owner) {
        super();
        this.velocity = createVector(0, 0);
        this.position = createVector(x, y);
        // collision radius
        this.r = 10.0;
        this.maxspeed = 1;
        this.selected = false;
        /** @type {p5.Vector} */
        this.moveTarget = null;
        /** @type {Unit} */
        this.attackTarget = null;
        /** @type {StateEnum} */
        this.state = Unit.statesEnum.guarding;
        /** @type {PlayersEnum} */
        this.owner = owner;
        this.dead = false;
    }
    /**
     * @typedef {number} StateEnum
     * @enum {StateEnum}
     */
    static statesEnum = Object.freeze({
        guarding: 1, moving: 2, attacking: 3, movingToAttack: 4});
    static reachMoveTargetRadius = 3;
    static aggroRange = 100;
    static damageToBarracks = 10;
    update() { 
        // check collisions
        for (let i = 0; i < entities.length; i++) {
            const other = entities._entities[i];
            if (other instanceof Unit){
                if (other === this) {
                    continue;
                }

                if (this.checkCollision(other) && (this.owner != other.owner)) {
                    gm.destroy(this);
                    // destroy at end of frame
                    // TODO BUG
                    // for some reason destroying just `this` does not work
                    // there is some kind of asymmetry which I'm not able
                    // to understand. If this collides with other, in the
                    // update step of this, then in the update step of other
                    // we should get the same thing! and thus other should also
                    // destroy itself. But this doesn't happen.
                    gm.destroy(other);
                    // console.log("defer destroy" + this.id);
                    return;
                }
            } else if (other instanceof Barracks) {
                if (this.checkCollision(other) && (this.owner != other.owner)) {
                    // suicide against a building, damaging the building
                    gm.destroy(this);
                    other.sufferDamage(Unit.damageToBarracks);
                }
            }
        }

        // state machine logic

        if (this.state === Unit.statesEnum.moving) { 
            // set velocity to go towards target
            this.velocity = p5.Vector.sub(this.moveTarget, this.position);
            this.velocity.normalize();
            this.velocity.mult(this.maxspeed);

            // stop when you reach the target
            if (p5.Vector.dist(this.moveTarget, this.position) < Unit.reachMoveTargetRadius) {
                this.velocity = createVector(0, 0);
                this.state = Unit.statesEnum.guarding;
            }
        }

        if (this.state === Unit.statesEnum.guarding) { // search for enemies around
            let enemyUnitsInRange = allUnits()
                .filter(u => u.owner != this.owner)
                .map(u => [u, p5.Vector.dist(u.position, this.position)])
                .filter(u_d => u_d[1]<Unit.aggroRange)

            // chase unit which is closest
            if (enemyUnitsInRange.length) {
                this.state = Unit.statesEnum.movingToAttack;
                this.attackTarget = enemyUnitsInRange
                    .reduce((prev, curr) => {
                        try{
                            let [prevU, prevD] = prev;
                            let [currU, currD] = curr;
                            return prevD < currD ? prev : curr;
                        } catch(err) {
                            console.error(prev, curr, err);
                            return null;
                        }
                    })[0]
            }
        }

        if (this.state === Unit.statesEnum.movingToAttack) {
            if (this.attackTarget.dead === true) {
                // if dead, go back guarding
                this.velocity = createVector(0, 0);
                this.state = Unit.statesEnum.guarding;
                return;
            }

            this.velocity = p5.Vector.sub(this.attackTarget.position, this.position);
            this.velocity.normalize();
            this.velocity.mult(this.maxspeed);
            // go against the target
            // (when you touch it, you fight and both die, probably)
        }

        this.position.add(this.velocity);
    }
    render() {
        if (this.selected) { 
            // selection circle
            push();
            stroke(color(0, 255, 0));
            noFill();
            // @ts-ignore
            circle(this.position.x, this.position.y, this.r * 2);
            pop();
        }

        // Draw a triangle rotated in the direction of velocity
        // If still, draw a circle
        let theta = this.velocity.heading() + radians(90);
        if (this.owner === playersEnum.you) {
            // @ts-ignore
            fill(127);
            // @ts-ignore
            stroke(200);
        } else if (this.owner === playersEnum.enemy) {
            fill(color(255, 0, 0));
            stroke(color(200, 50, 50));
        }
        // circle
        if ((this.velocity.x === 0) && (this.velocity.y === 0))
        {
            // @ts-ignore
            circle(this.position.x, this.position.y, this.r)
        } else
        {
            // triangle
            let l = this.r / 3;
            push();
            translate(this.position.x, this.position.y);
            rotate(theta);
            beginShape();
            vertex(0, -l * 2);
            vertex(-l, l * 2);
            vertex(l, l * 2);
            endShape(CLOSE);
            pop();
        }
    }
    borders() {}
    moveTo(x, y) {
        this.state = Unit.statesEnum.moving;
        this.moveTarget = createVector(x, y);
    }
    /**
     * @param {Unit | Barracks} other
     */
    checkCollision(other) {
        if (other instanceof Unit){
            return p5.Vector.dist(this.position, other.position) < this.r + other.r;
        } else if (other instanceof Barracks) {
            return p5.Vector.dist(this.position, other.position) < this.r + Barracks.width / sqrt(2);
            // TODO make sqrt(2) cached/static so that it isn't recomputed every time
        }
}} 

// Produces units
class Barracks extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {PlayersEnum} owner
     */
    constructor(x, y, owner) {
        super();
        this.position = createVector(x, y);
        this.owner = owner;
        this.timeSinceLastSpawn = 0;
        this.spawningPeriod = 5000; // ms
        this.life = Barracks.maxLife;
    }
    static width = 20;
    static spawnRadius = 25;
    static maxLife = 50;
    update() {
        let now = performance.now();
        if (now - this.timeSinceLastSpawn > this.spawningPeriod) {
            // spawn units!
            const th = random(TWO_PI)
            const u = new Unit(
                this.position.x + Barracks.spawnRadius * cos(th),
                this.position.y + Barracks.spawnRadius * sin(th),
                this.owner);
            gm.spawn(u);

            this.timeSinceLastSpawn = now;
        }
    }
    render() {
        if (this.owner === playersEnum.you) {
            // @ts-ignore
            fill(227);
            // @ts-ignore
            stroke(200);
        } else if (this.owner === playersEnum.enemy) {
            fill(color(255, 0, 0));
            stroke(color(255, 100, 100));
        }
        rect(this.position.x - Barracks.width / 2, 
            this.position.y - Barracks.width / 2,
            Barracks.width,
            Barracks.width);
        
        // life bar
        // @ts-ignore
        stroke(0);
        // @ts-ignore
        fill(50);
        textAlign(CENTER);
        text(`${this.life}`, this.position.x, this.position.y);
    }
    sufferDamage(damageToBarracks) {
        this.life -= damageToBarracks;
        if (this.life <= 0) {
            gm.destroy(this);
            gm.mq.publish(MQ.eventTypes.dies, this, null);
        }
    }
}

class ResourceNode extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        super();
        this.position = createVector(x,y);
        this._init();
    }
    static radius = 10;
    static frequency = 0.004;
    static captureRadius = 30;
    static captureTime = 5000;
    static captureCircleGraphicsRadius = 40;
    _init() {
        this.owner = playersEnum.neutral;
        this.capturer = null;
        this.timeStartedCapture = 0;
        this.barracksOnTop = null;
    }
    update() {
        // if this is a free node, check for capture
        if (this.isFree()) {
            let now = performance.now();
            let ownersOfUnitsInRange = allUnits()
                .map(u => [u, p5.Vector.dist(u.position, this.position)])
                .filter(u_d => u_d[1]<ResourceNode.captureRadius)
                .map(u_d => u_d[0].owner)
                .filter((value,index,self) => self.indexOf(value) === index);
            
            // cancel capture if there are multiple player trying to capture
            if (ownersOfUnitsInRange.length >= 2) {                
                this.capturer = null;
                this.timeStartedCapture = 0;
            }
            else if (ownersOfUnitsInRange.length === 1) {
                if (ownersOfUnitsInRange[0] === this.capturer) {
                    // continue capturing
                    if (now - this.timeStartedCapture > 5000) {
                        // captured!
                        this.owner = this.capturer;
                        this.capturer = null;
                        this.timeStartedCapture = 0;

                        // build a barracks on top of this node
                        // this will signal to this node that it's not free anymore
                        // as long as that barrack lives on top
                        this.barracksOnTop = new Barracks(
                            this.position.x, this.position.y, this.owner);
                        gm.spawn(this.barracksOnTop);
                        gm.mq.subscribeUntilTrue(
                            MQ.eventTypes.dies, (publisher, data) => {
                                if (publisher === this.barracksOnTop) {
                                    // reset resource node
                                    this._init();
                                    // signal that we want to unsubscribe
                                    return true;
                                }
                            });
                    }
                }
                else if (ownersOfUnitsInRange[0] !== this.owner) {
                    // start new capture
                    this.capturer = ownersOfUnitsInRange[0];
                    this.timeStartedCapture = now;
                }
                this.capturer = ownersOfUnitsInRange[0];
            }
            else if (ownersOfUnitsInRange.length === 0) {
                if (this.beingCaptured()){
                    // cancel capture
                    this.capturer = null;
                }
            }
        }
    }
    render() {
        // plot if this is a free node
        if (this.isFree()){
            push();
            if (this.owner === playersEnum.neutral) {
                fill(color(100,150, 255));
            } else if (this.owner === playersEnum.you) {
                fill(color(255,255,255));
            } else if (this.owner === playersEnum.enemy) {
                fill(color(255,200,200));
            }
            noStroke();

            ellipse(this.position.x, this.position.y,
                ResourceNode.radius * ( 2+cos(ResourceNode.frequency * performance.now())),
                ResourceNode.radius * ( 2 -cos(ResourceNode.frequency * performance.now()))
            );
            ellipse(this.position.x, this.position.y,
                ResourceNode.radius * (2 - cos(ResourceNode.frequency * performance.now())),
                ResourceNode.radius * (2 +cos(ResourceNode.frequency * performance.now()))
            );                    
            pop();

            if (this.beingCaptured()) {
                // plot capturing graphics
                push();
                if (this.capturer === playersEnum.you) {
                    stroke(color(255,255,255,150));
                } else if (this.capturer === playersEnum.enemy) {
                    stroke(color(255,150,150,200));
                }
                strokeWeight(4);
                noFill();
                arc(this.position.x,
                    this.position.y,
                    ResourceNode.captureCircleGraphicsRadius,
                    ResourceNode.captureCircleGraphicsRadius,
                    0,
                    (performance.now() - this.timeStartedCapture)/ResourceNode.captureTime * TWO_PI);
                pop();
            }
        }
    }
    isFree() {
        return this.barracksOnTop === null;
    }
    beingCaptured() {
        return this.capturer !== null;
    }
}
