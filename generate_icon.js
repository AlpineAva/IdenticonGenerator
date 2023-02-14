const WHITE_PIXEL = [255, 255, 255, 255];
const MIN_COLOR_SUM = 128;
const MARGIN = 10;
const RGBA_SIZE = 4;

/**
 * Calls the function to generate the user icon, then resizes the canvas and writes the data to the canvas
 */
function generateGithubStyleIcon() {
    // Get the size and scale inputs and validate them
    const height = parseInt(document.getElementById('iconHeight').value);
    const width = parseInt(document.getElementById('iconWidth').value);
    const scale = parseInt(document.getElementById('iconScale').value);
    if(height < 1 || height > 50) {
        alert('ERROR: height is outside the specified range');
        return;
    }
    if(width < 1 || width > 50) {
        alert('ERROR: width is outside the specified range');
        return;
    }
    if(scale < 1 || scale > 100) {
        alert('ERROR: scale is outside the specified range');
        return;
    }

    // get and validate username and generate the deterministic hash
    const username = document.getElementById('username').value;
    const hash = md5(username).toString(); // hash.length == 32

    // Get the Canvas, unhide it if necessary, and set its new height & width
    let canvas = document.getElementById('userIcon');
    canvas.removeAttribute("hidden");
    canvas.width = (width * scale) + (MARGIN * 2);
    canvas.height = (height * scale) + (MARGIN * 2);

    // Generate the scaled pixel array and write it to the canvas
    var context = canvas.getContext("2d");
    const pixelArray = generateIcon(hash, height, width, scale);
    const imageData = new ImageData(pixelArray, width * scale);
    context.putImageData(imageData, MARGIN, MARGIN);

    // enable the icon download button...
    document.getElementById('downloadIconButton').removeAttribute("disabled");
}

/**
 * Generates the icon randomly using the input hash as a seed.  It will produce an icon with height & width
 * specified by the constants.  For example... If height = 3, width = 3, and scale = 4, the icon will start like
 * 1 2 3
 * 4 5 6
 * 7 8 9
 * 
 * Then will be scaled by 4x to ultimately look like
 * 1 1 1 1 2 2 2 2 3 3 3 3
 * 1 1 1 1 2 2 2 2 3 3 3 3
 * 1 1 1 1 2 2 2 2 3 3 3 3
 * 1 1 1 1 2 2 2 2 3 3 3 3
 * 4 4 4 4 5 5 5 5 6 6 6 6
 * 4 4 4 4 5 5 5 5 6 6 6 6
 * 4 4 4 4 5 5 5 5 6 6 6 6
 * 4 4 4 4 5 5 5 5 6 6 6 6
 * 7 7 7 7 8 8 8 8 9 9 9 9
 * 7 7 7 7 8 8 8 8 9 9 9 9
 * 7 7 7 7 8 8 8 8 9 9 9 9
 * 7 7 7 7 8 8 8 8 9 9 9 9
 * @param {*} hash 
 * @param {*} scale 
 * @returns An array of size height * scale * width * scale * rgba_size (2) representing pixel values 0-255
 */
function generateIcon(hash, height, width, scale) {
    // get the color assosciated with the input hash
    const coloredPixel = generateColor(hash);
    var imageData = [];
    let hashIndex = 0;
    for(let y = 0; y < height; y++) {
        var buffer = []; // store the pixels we use so we can reflect the image on the right side
        var rowData = [];
        while(buffer.length < width / 2.0) {
            let pixel = isHexOdd(hash, hashIndex) ? coloredPixel: WHITE_PIXEL;
            rowData.push(Array(scale).fill(pixel).flat()); // duplicate the pixel "scale" times
            buffer.push(pixel);
            hashIndex++;
        }

        // Reflect the pixels after the center line onto the right side of the row
        let i = buffer.length - (width % 2 == 0 ? 1 : 2); // -2 if width is odd so we don't reflect center row
        while(i >= 0) {
            rowData.push(Array(scale).fill(buffer[i]).flat()); // duplicate the pixel "scale" times
            i--;
        }

        // Finally, repeat the rowData "scale" times in the pixels array
        rowData = rowData.flat();
        imageData.push(Array(scale).fill(rowData).flat());
    }
    imageData = imageData.flat();
    return new Uint8ClampedArray(imageData);
}

/**
 * This is a simple bit checker to help other functions generate useful deterministic values.
 * Input a hash and an index and it will tell you if the character at that index is odd.
 * @param {*} hash string of characters for the hash
 * @param {*} index index in hash to check if byte value is odd
 * @returns true if the byte value at the input is index, and false if it is even
 */
function isHexOdd(hash, index) {
    return hash.charCodeAt(index % hash.length) % 2 == 1;
}

/**
 * This function generates a color for our user's avatar.  The color is gauaranteed to have
 * one of the RGB values set to 0 to eliminate greys, and is gauaranteed to have sum values
 * set to higher than MIN_COLOR_SUM to elimiate too-light colors.
 * @param {*} hash hash code which we expect to be at least 24 characters in length
 * @returns RGBA colors array
 */
function generateColor(hash) {
    // RED
    let index = hash.length; // start from end and work backwards...
    let red = 0;
    for(let i = 0; i < 8; i++) {
        red += isHexOdd(hash, index - i) * Math.pow(2, i);
    }
    
    // GREEN
    let green = 0;
    index -= 8; // set the index back by 8 for the next color
    for(let i = 0; i < 8; i++) {
        green += isHexOdd(hash, index - i) * Math.pow(2, i);
    }

    // BLUE
    let blue = 0;
    index -= 8; // set the index back by 8 for the next color
    for(let i = 0; i < 8; i++) {
        blue += isHexOdd(hash, index - i) * Math.pow(2, i);
    }

    // eliminate lowest value to eliminate greys...
    if(red < green && red < blue) {
        red = 0;
    } else if(green < red && green < blue) {
        green = 0;
    } else {
        blue = 0;
    }

    // Default to green if all values are 0... odds of this are 1 in ~4,000,000...
    if(red == 0 && green == 0 && blue == 0) {
        green = 128;
    }

    // Increase values to at least MIN_COLOR_SUM to eliminate black colors
    let sum = red + green + blue;
    if(sum < MIN_COLOR_SUM) {
        let multiplier = MIN_COLOR_SUM / sum; // some value greater than 1
        red *= multiplier;
        green *= multiplier;
        blue *= multiplier;
    }

    return [red, green, blue, 255];
}

// reference: https://stackoverflow.com/questions/8126623/downloading-canvas-element-to-an-image
function downloadIcon() {
    var image = document.getElementById("userIcon").toDataURL("image/png");
    var a = document.createElement('a');
    a.download = 'identicon.png';
    a.href = image;
    a.click();
}