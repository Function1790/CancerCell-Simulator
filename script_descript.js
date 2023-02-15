//from HTML
const stateView = document.getElementById("state")
const nutrientView = document.getElementById("nutrient")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

//Constant
const CollideForce = 0.1
const CellSize = 10
const CellDivision_Period = 1000
const NormalCell_Telomere = 5
const InitialLifeValue = 100
const InitiaNutrient = 10000
const EatRange = 50

const NucleusSize = CellSize / 4
const PI2 = Math.PI * 2
const BoundaryX = canvas.width - CellSize * 2
const BoundaryY = canvas.height - CellSize * 2

//Variable
let nutrient = InitiaNutrient
let renderList = []
let destroyList = []
let createList = []

//Function
const print = (t) => { console.log(t) }

function selectColor(color) {
    ctx.fillStyle = color
    ctx.strokeStyle = color
}

function drawCricle(x, y, r) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, PI2)
    ctx.fill()
    ctx.closePath()
}

function random(m) {
    return Math.random() * m
}

function findIndex(arr, item) {
    for (i = 0; i < arr.length; i++) {
        if (arr[i] == item) {
            return i
        }
    }
    return -1
}

function pushDesctroyObject(item) {
    destroyList.push(findIndex(renderList, item))
}

function sym(n) {
    if (n < 0) {
        return -1
    }
    return 1
}

function randSym() {
    if (parseInt(random(2)) == 0) {
        return 1
    }
    return -1
}

function processOverlap(A, B) {
    const distance = (A.x - B.x) ** 2 + (A.y - B.y) ** 2
    const r = (A.r + B.r) ** 2

    if (distance < r) {
        //let delta = new Vector(sym(A.x - B.x) * CollideForce, sym(A.y - B.y) * CollideForce)
        let delta = new Vector(A.x - B.x, A.y - B.y)
        delta.mul(CollideForce * 0.1)
        A.pos.add(delta)
        B.pos.sub(delta)
    }
}

function eatNutrientOfCell(normal_cell, cancer_cell) {
    const distance = distanceBetween(normal_cell.pos, cancer_cell.pos)

    if (distance <= EatRange) {
        normal_cell.dying()
    }
}

function interactionBetween(A, B) {
    processOverlap(A, B)
    if (A.constructor.name == 'Cell' && B.constructor.name == 'CancerCell') {
        eatNutrientOfCell(A, B)
    } else if (A.constructor.name == 'CancerCell' && B.constructor.name == 'Cell') {
        eatNutrientOfCell(B, A)
    }
}

function reachWall(axis, wall) {
    if (axis < 30) {
        return CollideForce
    }
    else if (axis > wall) {
        return -CollideForce
    }
    return 0
}

function distanceBetween(A, B) {
    return Math.sqrt((A.x - B.x) ** 2 + (A.y - B.y) ** 2)
}

//Class
class Color {
    constructor(r, g, b, a) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }
    toCSS() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`
    }
    copy() {
        return new Color(this.r, this.g, this.b, this.a)
    }
}
const NormalCell_Color = new Color(255, 155, 90, 0.6)
const CancerCell_Color = new Color(90, 180, 255, 0.6)

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    add(vector2) {
        this.x += vector2.x
        this.y += vector2.y
    }
    sub(vector2) {
        this.x -= vector2.x
        this.y -= vector2.y
    }
    mul(m) {
        this.x *= m
        this.y *= m
    }
    div(m) {
        this.x /= m
        this.y /= m
    }
    toStr() {
        return `(${this.x}, ${this.y})`
    }
}

class Cell {
    constructor(x, y, r, telomere, color, consumeAmount = 1) {
        this.pos = new Vector(x, y)
        this.r = r
        this.default_r = r
        this.color = color

        this.life = InitialLifeValue

        this.telomere = telomere
        this.grow_tick = 0
        this.division_period = random(CellDivision_Period / 2) + CellDivision_Period
        this.S_period = this.division_period * 0.6
        this.consumeAmount = consumeAmount
    }
    get x() {
        return this.pos.x
    }
    get y() {
        return this.pos.y
    }
    eatNutrient() {
        if (nutrient < 1) {
            this.dying()
            return false
        }
        return true
    }
    grow() {
        if (this.eatNutrient() == false || this.life <= 0) {
            this.divide = null
            return
        }

        this.grow_tick++

        if (this.grow_tick % 200 == 0) {
            nutrient -= this.consumeAmount
        }

        this.r += this.grow_tick * 0.000005
        if (this.grow_tick > this.division_period) {
            this.divide()
        }
    }
    move() {
        this.pos.x += reachWall(this.x, BoundaryX)
        this.pos.y += reachWall(this.y, BoundaryY)
    }
    draw() {
        selectColor(this.color.toCSS())
        drawCricle(this.x, this.y, this.r)

        //세포핵
        selectColor(`rgba(0,0,0,${this.color.a + 0.3})`)
        if (this.grow_tick > this.S_period) {
            drawCricle(this.x - NucleusSize / 2, this.y, NucleusSize)
            drawCricle(this.x + NucleusSize / 2, this.y, NucleusSize)
        }
        else {
            drawCricle(this.x, this.y, NucleusSize)
        }
    }
    dying() {
        this.life--
        if (this.color.a > 0.2 && this.life <= 0) {
            this.color.a -= 0.001
        }
    }
    destroySelf() {
        pushDesctroyObject(this)
    }
    divide() {
        const telomere = this.telomere - 1
        if (this.telomere > 0) {
            let delta = [random(10) * randSym(), random(10) * randSym()]
            createList.push(new Cell(this.x + delta[0], this.y + delta[1], this.default_r, telomere, this.color))
            createList.push(new Cell(this.x - delta[0], this.y - delta[1], this.default_r, telomere, this.color))
        }
        this.grow = () => { }
        this.destroySelf()
    }
}

class CancerCell extends Cell {
    constructor(x, y, r) {
        super(x, y, r, 10, CancerCell_Color.copy(), 2)
        this.vel = new Vector(0, 0)
    }
    divide() {
        const telomere = this.telomere
        if (this.telomere > 0) {
            let delta = [random(10) * randSym(), random(10) * randSym()]
            createList.push(new CancerCell(this.x + delta[0], this.y + delta[1], this.default_r, telomere, this.color))
            createList.push(new CancerCell(this.x - delta[0], this.y - delta[1], this.default_r, telomere, this.color))
        }
        this.grow = () => { }
        pushDesctroyObject(this)
    }
    move() {
        super.move()
        this.pos.add(this.vel)
    }
    eatNutrient() {
        const result = super.eatNutrient()
        if (result == false) {

        }
        return result
    }
    draw(){
        super.draw()
    }
}

//About Render
function processRenderObject() {
    // Render & Behave
    for (var i = 0; i < renderList.length; i++) {
        renderList[i].draw()
        renderList[i].grow()
        renderList[i].move()
        for (var j = i + 1; j < renderList.length; j++) {
            interactionBetween(renderList[i], renderList[j])
        }
    }

    // Destroy
    for (var i = destroyList.length - 1; i >= 0; i--) {
        if (destroyList[i] == -1) {
            print("Index -1")
        }
        renderList.splice(destroyList[i], 1)
    }

    // Create
    for (var i = createList.length - 1; i >= 0; i--) {
        renderList.push(createList[i])
    }

    destroyList = []
    createList = []
}

for (var i = 0; i < 40; i++) {
    renderList.push(new Cell(random(BoundaryX), random(BoundaryY), CellSize, NormalCell_Telomere, NormalCell_Color.copy()))
}

for (var i = 0; i < 4; i++) {
    renderList.push(new CancerCell(random(BoundaryX), random(BoundaryY), CellSize + 2))
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    processRenderObject()

    // Data Viewer in HTML
    if (nutrient < 0) {
        nutrient = 0
    }
    stateView.innerText = `Cell : ${renderList.length}`
    nutrientView.innerText = `Nutrient : ${nutrient}`

    requestAnimationFrame(render)
}
render()