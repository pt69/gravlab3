//MIT-Lizenz: Copyright (c) 2018 Matthias Perenthaler
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


let local_frameRate = 60;
let gObjektArray = [];

let gravitationsKonstante = 1;
let resVektorenAnzeigen = false;

let deltaT = 0;

let entfernungMassen = 100;
let satellitMasse = 10;
let planetMasse = 100000;
let anfangsgeschwSatellit = 29;
let anfangsgeschwPlanet = 3;
let animationStart = false;

function resetCanvas() {
	gObjektArray = [];
	satellitMasseDazu();	
	zentralMasseDazu();
	animationStart = false;	
}

let settings;
let geschwStrichStaerke = 2;

function satellitMasseDazu() {
	let iniOrtVec = createVector(width/3, height/2+entfernungMassen);
	let iniGeschwVec = createVector(-anfangsgeschwSatellit, 0);
	let iniMasse = satellitMasse;
	let farbe = color(78,97,114);
  gObjektDazu(iniMasse, iniOrtVec, iniGeschwVec, farbe);
}

function zentralMasseDazu() {
	let iniOrtVec = createVector(width/3, height/2);
	let iniGeschwVec = createVector(anfangsgeschwPlanet, 0);
	let iniMasse = planetMasse;
	let farbe = color(0,50,100);
  gObjektDazu(iniMasse, iniOrtVec, iniGeschwVec, farbe);
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  frameRate(local_frameRate);
  deltaT = 0.001 * local_frameRate;
	
  settings = QuickSettings.create(20, 20, "Gravitationslabor 3");
	settings.setDraggable(true);
	settings.addRange("Masse Mond", 10, 50000, satellitMasse, 1, function(value) { satellitMasse = value; });	
	settings.addRange("Geschw. Mond", -100, 100, anfangsgeschwSatellit, 1, function(value) { anfangsgeschwSatellit = value; });
	settings.addRange("Masse Planet", 10, 200000, planetMasse, 1, function(value) { planetMasse = value; });
	settings.addRange("Geschw. Planet", 0, 15, anfangsgeschwPlanet, 1, function(value) { anfangsgeschwPlanet = value; });
	settings.addRange("Entfernung", 50, 200, entfernungMassen, 1, function(value) { entfernungMassen = value; });	
	settings.addButton("Objekte setzen", function() { resetCanvas(); });	
		settings.overrideStyle("Objekte setzen", "width", "100%");	
	settings.addBoolean("Geschwindigkeitsvektor", false, function(value) { resVektorenAnzeigen = value; });
	settings.addRange("Gravitationskonstante", 0, 5, gravitationsKonstante, 0.1, function(value) { gravitationsKonstante = value; });		
	settings.addButton("Animation starten", function() { 
		animationStart = true;
	});
	settings.overrideStyle("Animation starten", "width", "100%");	
	settings.overrideStyle("Animation starten", "background-color", "#34a853");	
	settings.overrideStyle("Animation starten", "color", "white");
	settings.addHTML("Version", "V1.01 - Pt");
		settings.hideTitle("Version");  	
		
	resetCanvas();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

let newFrameKoord;
let oldFrameKoord;
let lastFrameKoord;

function mousePressed() {
  newFrameKoord = createVector(mouseX, mouseY);
}

function mouseReleased() {
  oldFrameKoord = createVector(mouseX, mouseY);
}

function draw() {
  background(250);

  if (gObjektArray.length > 0) {
  	gravitationsRechner(gObjektArray);
		gObjekteZeichnen(gObjektArray);
  }
}

function absorbiereGObjekt(gObjArr) {
	if (this.masse < gObjArr.masse) {
		this.farbe = gObjArr.farbe;
	}
	//zentraler vollstaendig inelastischer Stoss mit Impulserhaltung
	this.geschwindigkeit.x = (this.geschwindigkeit.x * this.masse + gObjArr.geschwindigkeit.x * gObjArr.masse) / (this.masse + gObjArr.masse);
	this.geschwindigkeit.y = (this.geschwindigkeit.y * this.masse + gObjArr.geschwindigkeit.y * gObjArr.masse) / (this.masse + gObjArr.masse);
	//neuer Ort des absorbierten Körpers aus Schwerpunktsatz
	this.ort.x = (this.ort.x * this.masse + gObjArr.ort.x * gObjArr.masse) / (this.masse + gObjArr.masse);
	this.ort.y = (this.ort.y * this.masse + gObjArr.ort.y * gObjArr.masse) / (this.masse + gObjArr.masse);
	//neue Masse aus Addition der Massen
	this.masse += gObjArr.masse;
	//neuer Radius im vereinfachten Modell
	this.radius = Math.cbrt((3*this.masse)/(4*PI));
}

function gObjekt(m, ort, v, f) {
	this.masse = m;
	this.ort = ort;
	this.geschwindigkeit = v;	
	this.gKraftArray = [];
	this.resGKraft = createVector(0, 0);
	this.farbe = f;
	this.radius = Math.cbrt((3*this.masse)/(4*PI));
  this.verschieben = function(neueKoord) {
    this.ort = neueKoord;
  }; 
  this.kollision = absorbiereGObjekt;
  this.pfad = [];
}

function gObjektDazu(m, ort, v, farbe) {
	let gObj = new gObjekt(m, ort, v, farbe);
	gObjektArray.push(gObj);
}

function gObjekteZeichnen(gObjArr) {
	for (let i = 0; i < gObjArr.length; i++) {
		for (let k = 0; k < gObjArr[i].pfad.length; k++) {
			strokeWeight(0.8);
			stroke(210);
			noFill();
			ellipse(gObjArr[i].pfad[k].x, gObjArr[i].pfad[k].y, 1, 1);
		}		
		let x = gObjArr[i].ort.x;
		let y = gObjArr[i].ort.y;
		let offset = 8;
		if(resVektorenAnzeigen && i == 0){
			strokeWeight(geschwStrichStaerke);
			stroke('wheat');
			fill('wheat');
			line(x, y, x + gObjArr[i].geschwindigkeit.x, y + gObjArr[i].geschwindigkeit.y);
	    push();
		    var angle = atan2(gObjArr[i].geschwindigkeit.y, gObjArr[i].geschwindigkeit.x);
		    translate(x + gObjArr[i].geschwindigkeit.x, y + gObjArr[i].geschwindigkeit.y);
		    rotate(angle+HALF_PI);
		    triangle(-offset*0.5, offset, offset*0.5, offset, 0, 0);
	    pop();			
		}		
		strokeWeight(1);
		stroke(gObjArr[i].farbe);
		fill(gObjArr[i].farbe);
		ellipse(x, y, gObjArr[i].radius*2, gObjArr[i].radius*2);	
	}
}

//Inverse Euler
function gravitationsRechner(gObjArr) {
	for (let i = 0; i < gObjArr.length; i++) {
		let gKraftTempArray = [];
		gObjArr[i].gKraftArray = [];
		let resultierendeGKraft = createVector(0,0);
		let gKraftX = 0;
		let gKraftY = 0;
		for (let j = 0; j < gObjArr.length; j++) {
			if (j != i) {
				let xDist = gObjArr[i].ort.x - gObjArr[j].ort.x;
				let yDist = gObjArr[i].ort.y - gObjArr[j].ort.y;
				let entfernung = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
				if (entfernung < gObjArr[i].radius + gObjArr[j].radius) {
					gObjArr[i].kollision(gObjArr[j]);
					gObjArr.splice(j, 1);
				} 
				else {				
					let xDist = gObjArr[i].ort.x - gObjArr[j].ort.x;
					let yDist = gObjArr[i].ort.y - gObjArr[j].ort.y;
					let entfernung = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
					let gravitationsKraft = gravitationsKonstante * (gObjArr[i].masse * gObjArr[j].masse) / Math.pow(entfernung, 2);
					gKraftX = Math.abs(gravitationsKraft * (xDist / entfernung)) * Math.sign(xDist);
					gKraftY = Math.abs(gravitationsKraft * (yDist / entfernung)) * Math.sign(yDist);
					resultierendeGKraft.x -= gKraftX;
					resultierendeGKraft.y -= gKraftY;
					let tempVec = createVector(0, 0);
					gKraftTempArray.push(tempVec);
					gKraftTempArray[gKraftTempArray.length-1].x = -gKraftX;
					gKraftTempArray[gKraftTempArray.length-1].y = -gKraftY;	
				}
			}
		}
		if(animationStart) {
				//a = Kraft / Masse, dv = a * dt
				gObjArr[i].geschwindigkeit.x += (resultierendeGKraft.x / gObjArr[i].masse) * deltaT;
				gObjArr[i].geschwindigkeit.y += (resultierendeGKraft.y / gObjArr[i].masse) * deltaT;
		}		
		gObjArr[i].resGKraft.x = 0;
		gObjArr[i].resGKraft.y = 0;
		gObjArr[i].resGKraft.add(resultierendeGKraft);
		gObjArr[i].gKraftArray = gKraftTempArray.slice();
	}
	if(animationStart) {
		for (let i = 0; i < gObjArr.length; i++) {
			//ds = v * dt
			gObjArr[i].ort.x += gObjArr[i].geschwindigkeit.x * deltaT;
			gObjArr[i].ort.y += gObjArr[i].geschwindigkeit.y * deltaT;
			let pfadVec = createVector(gObjArr[i].ort.x, gObjArr[i].ort.y);
			gObjArr[i].pfad.push(pfadVec);
			if(gObjArr[i].pfad.length > 1000) {
				gObjArr[i].pfad.splice(0, 1);
			}
		}	
	}	
}