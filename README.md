(oscar64pp)

NodeJS preprocessor for Oscar64
(c) 2023 by Dusty Murray (also under the psuedonym "Cursor Keys" or "Cursor Keys Retro")

This program can be called instead of the oscar64 compiler.
It is a wrapper.  It allows for inline code and data generation during compile time.
It does this by allowing you to write javascript code in your c files, inbetween start and end markers.
 
--Usage:  
>node oscar64.js <path_to_oscar64> <temporary_path> <options_to_oscar64> <files_to_oscar64>

* First param is path to oscar64 binary  
* Second param is temporary path for generated files
* All other params with "-" will be used for calling the compiler  
* All other params without "-" are files to be preprocessed  
* All given files will be preprocessed, and preprocessed files will be passed to the compiler  

See tests folder and buildtests script on how to compile.
See tests folder and src/testgen.c on some examples of code generation embedded in a c file

--Start and End tag:  
>/*!CGJS

starts a section of nodejs code, where you can do code generation  
*Note: this has to be on the start of a line  
>CGJS!\*/

end a section of nodejs code, where you can do code generation  
*Note: this has to be on the end of a line  

--Code Generation:  
To create/generated code, you can use the following keywords:  
* .byte     - create a small number (0-255)  
* .word     - split the number up into a low and hi byte, and output both  
* .number   - create any number, do not care about it's size  
* .hbyte    - create a hexadecimal byte value  
* .string   - creates a "string"    
* .code     - any C code  
  
--Utility functions:  
These are extra functions to help you do code generation or data generation  

* pic = loadPicture( filename )  ; load a picture (png file)  
> byte = pic.get8MonoPixels( x, y , rgbForGroundColor )   ; get byte of 8 mono colored pixels, starting at x,y    
> rgb = getRGBPixel( x, y )                               ; get rgb object, representing the pixel    
> index = getPalettePixel( x, y, rgbArray)                ; get index of pixel, according to where the rgbValue matches the input color palette    
  
* res = mod(a,b)                                        ; modulus    
* res = round(a)                                        ; rounding down or up  
  
* console.log( string or object )                       ; log result during compiling / preprocessing for investigation  
  
--Example:  
Create an array of chars, with values that represent the cosinus function.  
  
>char cos[256] = {  
>/*!CGJS  
>  
>  const amplitude = 127;   
>  const frequency = 2 * Math.PI / 256;   
>  for (let i = 0; i < 256; i++) {  
>    const cosValue = Math.cos(frequency * i) * amplitude;  
>    .byte Math.round(cosValue + 127)  
>  }  
>  
>CGJS!*/  
>};  
