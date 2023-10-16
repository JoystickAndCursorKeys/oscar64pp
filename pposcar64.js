/*
    NodeJS preprocessor for Oscar64
    (c) 2023 by Dusty Murray (also under the psuedonym "Cursor Keys" or "Cursor Keys Retro"

    This program can be called instead of the oscar64 compiler.
    It is a wrapper.  It allows for inline code and data generation during compile time.
    It does this by allowing you to write javascript code in your c files, inbetween start and end markers.

    First param is tmp folder
    All params without "-" are files to be preprocessed
    All params with "-" will be used for calling the compiler
    All preprocessed files will be passed to the compiler
*/


const fs = require('fs');
const vm = require('vm');
const path = require('path');
var PNG = null;
try {
    PNG = require('pngjs').PNG;
}
catch (e) {
    console.log("e:" + e);
    console.log("pngjs not installed!!");
    console.log("To install, execute: npm install pngjs");
    process.exit(5);
}

const indent = "        ";

function dec2Hex(decimalNumber) {
    const hexadecimalString = decimalNumber.toString(16);
    return hexadecimalString.length === 1 ? '0' + hexadecimalString : hexadecimalString;
  }

var outString = function (x) {
    if (!vmCtx._outFirst) { vmCtx._outLine += ", "; }
    if (vmCtx._outLineCount++ > 20) {
        vmCtx._outLineCount = 0;
        vmCtx._outLine += '\n#line ' + vmCtx._lineNr;
        vmCtx._outLine += "\n" + indent;
    }
    vmCtx._outLine += ("\"" + x + "\"");
    vmCtx._outFirst = false;
}

var outCodeLine = function (x) {
    vmCtx._outLine += '\n#line ' + vmCtx._lineNr;
    vmCtx._outLine += "\n" + x + "";
    vmCtx._outFirst = true;
}

var outNumber = function (x) {
    if (!vmCtx._outFirst) { vmCtx._outLine += ", "; }
    if (vmCtx._outLineCount++ > 20) {
        vmCtx._outLineCount = 0;
        vmCtx._outLine += '\n#line ' + vmCtx._lineNr;
        vmCtx._outLine += "\n" + indent;
    }
    vmCtx._outLine += (x + "");
    vmCtx._outFirst = false;
}


var outHNumber = function (x) {
    if (!vmCtx._outFirst) { vmCtx._outLine += ", "; }
    if (vmCtx._outLineCount++ > 20) {
        vmCtx._outLineCount = 0;
        vmCtx._outLine += '\n#line ' + vmCtx._lineNr;
        vmCtx._outLine += "\n" + indent;
    }
    vmCtx._outLine += ("0x" + dec2Hex( x ) + "");
    vmCtx._outFirst = false;
}

var outWordAsBytes = function (x) {

    var hiByte = (Math.floor(x / 256));
    var loByte = (x - (hiByte * 256));

    outNumber(loByte);
    outNumber(hiByte);

}

var outWordAsHBytes = function (x) {

    var hiByte = (Math.floor(x / 256));
    var loByte = (x - (hiByte * 256));

    outHNumber(loByte);
    outHNumber(hiByte);

}



var myModulus = function (x, y) {
    return x % y;
}
var vmCtx;



function loadPicture(_filePath) {

    const filePath = _filePath;
    const fileData = fs.readFileSync(filePath);
    const png = PNG.sync.read(fileData);

    // Access the image's width and height
    const width = png.width;
    const height = png.height;

    console.log(" Loaded picture '" + _filePath + "' w: " + width + " h:" + height);
    var data = [];

    // Access and manipulate the pixel data

    var col = [];
    for (let x = 0; x < width; x++) {
        col = [];
        for (let y = 0; y < height; y++) {
            // Calculate the index for the current pixel
            const idx = (width * y + x) << 2;

            const red = png.data[idx];
            const green = png.data[idx + 1];
            const blue = png.data[idx + 2];
            const alpha = png.data[idx + 3];

            col.push({ r: red, g: green, b: blue });

        }
        data.push(col);
    }

    var getRGBPixel = function (x, y) {
        return this.pixels[x][y];
    }

    var getPalettePixel = function (x, y, colors) {

        var pixel = this.getRGBPixel(i, y);

        for (var i = 0; i < colors.length; i++) {
            var col = colors[i];
            if (col.r == pixel.r && col.g == pixel.g && col.b == pixel.b) {
                return i;
            }
        }

        return 0;
    }

    var get8MonoPixels = function (x, y, color) {

        var value = 128; var byteValue = 0;
        for (var i = x; i < x + 8; i++) {
            var pixel = this.getRGBPixel(i, y);
            if (color.r == pixel.r && color.b == pixel.b && color.g == pixel.g) {
                byteValue += value;
            }
            value /= 2;
        }

        return byteValue;
    }

    return {
        w: width, h: height,
        pixels: data, get8MonoPixels: get8MonoPixels,
        getRGBPixel: getRGBPixel,
        getPalettePixel: getPalettePixel
    };

}

var isStartCGSectionMarker =  function ( line ) {
    if( line.trim().startsWith('#!cg') ) {
        return true;
    }

    if( line.trim().startsWith('/*!CGJS') ) {
        return true;
    } 

    return false;
}


var isEndCGSectionMarker =  function ( line ) {
    if( line.trim().startsWith('#cg!') || line.trim().endsWith(' #cg!') ) {
        return true;
    }

    if( line.trim().endsWith('CGJS!*/') ) {
        return true;
    } 

    return false;
}

const processCFile = (inputFile, outputDir) => {
    const content = fs.readFileSync(inputFile, 'utf8');

    const lines = content.split('\n');
    let inBlock = false;
    let blockCode = '';
    let processedContent = '#line 1 "' + inputFile + '"\n';
    let lineNr = 0;
    for (const line of lines) {

        lineNr++;
        if ( isStartCGSectionMarker(line)) {

            inBlock = true;
        }
        else if ( isEndCGSectionMarker(line)) {
            //line.trim().startsWith('#cg!') || line.trim().endsWith(' #cg!')) {
            console.log("Executing ", blockCode.split('\n').length + " lines of nodejs code to generate c code at " + inputFile + ":" + lineNr)

            vmCtx = { console: console, _outLineCount: 0, _outLine: "", _outFirst: false, 
                mod: myModulus, round: Math.round, 
                outWordAsBytes: outWordAsBytes, outString: outString, outNumber: outNumber, outCodeLine: outCodeLine,
                outHNumber: outHNumber, outWordAsHBytes: outWordAsHBytes, loadPicture: loadPicture
            };

            vmCtx._outLine = indent;
            vmCtx._outFirst = true;
            vmCtx._outLineCount = 0;
            vmCtx._lineNr = lineNr;

            //console.log("Executing code: " + blockCode + "\n-------------------", vmCtx);
            
            var context = vm.createContext(vmCtx);
            vm.runInContext(blockCode, context);

            if (vmCtx._outLine) {
                processedContent += vmCtx._outLine;
            }
            blockCode = '';
            inBlock = false;

            if (vmCtx._outLine) {
                processedContent += '\n#line ' + lineNr + '\n';
            }
        }
        else if (inBlock) {
            //console.log("a----------------");

            var codeLine = line.trim();
            if (codeLine.startsWith(".byte ") || codeLine.startsWith(".byte\t")) {
                codeLine = "outNumber(" + codeLine.substring(6) + ");";
            }
            else if (codeLine.startsWith(".hbyte ") || codeLine.startsWith(".hbyte\t")) {
                codeLine = "outHNumber(" + codeLine.substring(7) + ");";
            }
            else if (codeLine.startsWith(".number ") || codeLine.startsWith(".number\t")) {
                //byte and number are treated the same
                codeLine = "outNumber(" + codeLine.substring(8) + ");";
            }
            else if (codeLine.startsWith(".word ") || codeLine.startsWith(".word\t")) {
                //only word is split into bytes
                codeLine = "outWordAsBytes(" + codeLine.substring(6) + ");";
            }
            else if (codeLine.startsWith(".hword ") || codeLine.startsWith(".hword\t")) {
                //only word is split into bytes
                codeLine = "outWordAsHBytes(" + codeLine.substring(7) + ");";
            }            
            else if (codeLine.startsWith(".string ") || codeLine.startsWith(".string\t")) {
                //string, is also not treated
                codeLine = "outString(" + codeLine.substring(8) + ");";
            }
            else if (codeLine.startsWith(".code ")) {
                //string, is also not treated
                codeLine = "outCodeLine(" + codeLine.substring(6) + ");";
            }


            blockCode += codeLine;
            if (codeLine.indexOf("code") > -1) {
                blockCode += '; code+="\\n";';
            }
            blockCode += '\n';  // Add the code after '##'      
        } else {
            //console.log("c----------------");
            processedContent += line + '\n';
        }
    }


    // Construct the output file name
    const baseName = path.basename(inputFile, path.extname(inputFile));
    const outputFileName = `${baseName}.g${path.extname(inputFile)}`;
    const outputPath = path.join(outputDir, outputFileName);

    fs.writeFileSync(outputPath, processedContent.trim());
    console.log("Generated " + outputPath)

    return outputPath;
};



console.log("ᗣᗣᗣ JSOSCAR64 - Javascript preprocessor and wrapper for Oscar64");
console.log("Version 0.5");



/*
    First param is tmp folder
    all params without "-" are files to be processed
    all params, but not the first, will be used for calling the compiler
*/

var tmpFolder = process.argv[3];
var compilerPath = process.argv[2];
var files = [];
var filesToCompile = "";
var compilerParams = "";
var i = 4;
for (i = 4; i < process.argv.length; i++) {
    var arg = process.argv[i];
    if (!arg.startsWith("-")) {
        files.push(arg);
    }
    else {
        if (compilerParams.length > 0) {
            compilerParams += " ";
        }
        compilerParams += arg;
    }
}


console.log("Tmp Folder:" + tmpFolder);
console.log("Files:" + files);
console.log("Compiler Path:" + compilerPath);
console.log("Compiler Params:" + compilerParams);


for (var i = 0; i < files.length; i++) {
    console.log("Processing " + files[i]);
    if (filesToCompile.length > 0) {
        filesToCompile += " ";
    }    
    filesToCompile+= processCFile(files[i], tmpFolder);
}


console.log("Calling Oscar64 with param: '" + compilerParams + "' and files: " + filesToCompile);


var exec = require('child_process').exec;
var child = exec(compilerPath + " " + compilerParams + " " + filesToCompile,
    function (error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
            console.log("Detected compiling error, Oscar says HALT!!");
            process.exit(1);
        }
    });