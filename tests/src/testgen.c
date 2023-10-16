
char sin[256] = {
/*!CGJS

  const amplitude = 127; 
  const frequency = 2 * Math.PI / 256; 
  for (let i = 0; i < 256; i++) {
    const sineValue = Math.sin(frequency * i) * amplitude;
    .byte Math.round(sineValue + 127)
  }

CGJS!*/
};



char cos[256] = {
/*!CGJS --------------------------------

  const amplitude = 127; 
  const frequency = 2 * Math.PI / 256; 
  for (let i = 0; i < 256; i++) {
    const cosValue = Math.cos(frequency * i) * amplitude;
    .byte Math.round(cosValue + 127)
  }

-------------------------------- CGJS!*/
};


char charset[] = {
/*!CGJS ----------------

  var pic = loadPicture("res/charset.png");
  for( var y=0; y<pic.h; y+=8) {
    for( var x=0; x<pic.w; x+=8) {
      for( var blockrow=0; blockrow<8;  blockrow++ ) {    
        var byte = pic.get8MonoPixels(x, y+blockrow, { r:255, g:255, b:255, a:255 });
        .hbyte byte
      }
    }

  }
  
---------------- CGJS!*/
};


int main( void ) {

  return 1;

}
