//from HTML
const stateView = document.getElementById("state")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

//Constant
const CrushForce = 0.1
const CellSize = 10
const CellDivision_Period = 300
const NormalCell_Telomere = 5

const NucleusSize = CellSize / 4
const PI2 = Math.PI * 2

const limitX = canvas.width - CellSize * 2
const limitY = canvas.height - CellSize * 2

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
        //let delta = new Vector(sym(A.x - B.x) * CrushForce, sym(A.y - B.y) * CrushForce)
        let delta = new Vector(A.x - B.x, A.y - B.y)
        delta.mul(CrushForce * 0.05)
        A.pos.add(delta)
        B.pos.sub(delta)
    }
}

function reachWall(axis, wall) {
    if (axis < 30) {
        return CrushForce
    }
    else if (axis > wall) {
        return -CrushForce
    }
    return 0
}

//Class
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
    constructor(x, y, r, telomere, color) {
        this.pos = new Vector(x, y)
        this.r = r
        this.default_r = r
        this.color = color

        this.telomere = telomere
        this.grow_tick = 0
        this.division_period = random(CellDivision_Period / 2) + CellDivision_Period
        this.S_period = this.division_period * 0.6
    }
    get x() {
        return this.pos.x
    }
    get y() {
        return this.pos.y
    }
    grow() {
        this.grow_tick++
        this.r += this.grow_tick * 0.000005
        if (this.grow_tick > this.division_period) {
            this.divide()
        }
    }
    move() {
        this.pos.x += reachWall(this.x, limitX)
        this.pos.y += reachWall(this.y, limitY)
    }
    draw() {
        selectColor(this.color)
        drawCricle(this.x, this.y, this.r)

        //세포핵
        selectColor("rgba(0,0,0,0.8)")
        if (this.grow_tick > this.S_period) {
            drawCricle(this.x - NucleusSize / 2, this.y, NucleusSize)
            drawCricle(this.x + NucleusSize / 2, this.y, NucleusSize)
        }
        else {
            drawCricle(this.x, this.y, NucleusSize)
        }
    }
    divide() {
        const telomere = this.telomere - 1
        if (this.telomere > 0) {
            let delta = [random(10) * randSym(), random(10) * randSym()]
            createList.push(new Cell(this.x + delta[0], this.y + delta[1], this.default_r, telomere, this.color))
            createList.push(new Cell(this.x - delta[0], this.y - delta[1], this.default_r, telomere, this.color))
        }
        this.grow = () => { }
        pushDesctroyObject(this)
    }
}

class CancerCell extends Cell {
    constructor(x, y, r) {
        super(x, y, r, 10, "rgba(90,180,255,0.5)")

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
}

//About Render
function renderObject() {
    for (var i = 0; i < renderList.length; i++) {
        renderList[i].draw()
        renderList[i].grow()
        renderList[i].move()
        for (var j = i + 1; j < renderList.length; j++) {
            processOverlap(renderList[i], renderList[j])
        }
    }

    for (var i = destroyList.length - 1; i >= 0; i--) {
        if (destroyList[i] == -1) {
            print("Index -1")
        }
        renderList.splice(destroyList[i], 1)
    }

    for (var i = createList.length - 1; i >= 0; i--) {
        renderList.push(createList[i])
    }

    destroyList = []
    createList = []
}

let renderList = []
let destroyList = []
let createList = []

for (var i = 0; i < 20; i++) {
    if (randSym() == 1) {
        renderList.push(new Cell(random(limitX), random(limitY), CellSize, NormalCell_Telomere, "rgba(255,155,90,0.5)"))
    } else {
        renderList.push(new CancerCell(random(limitX), random(limitY), CellSize + 2))
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    renderObject()
    stateView.innerText=`Cell : ${renderList.length}`

    requestAnimationFrame(render)
}
render()