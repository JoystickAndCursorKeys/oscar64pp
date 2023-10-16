oscar64pp

NodeJS preprocessor for Oscar64
(c) 2023 by Dusty Murray (also under the psuedonym "Cursor Keys" or "Cursor Keys Retro")

This program can be called instead of the oscar64 compiler.
It is a wrapper.  It allows for inline code and data generation during compile time.
It does this by allowing you to write javascript code in your c files, inbetween start and end markers.

First param is path to oscar64 binary 
Second param is temporary path for generated files
All other params without "-" are files to be preprocessed
All other params with "-" will be used for calling the compiler
All preprocessed files will be passed to the compiler
    
Usage:
node oscar64.js <path_to_oscar64> <temporary_path> <options_to_oscar64> <files_to_oscar64>

See tests folder and buildtests script on how to compile.
See tests folder and src/testgen.c on some examples of code generation embedded in a c file

Utility function:
These are extra functions to help you do code generation or data generation:

--loadPicture( filename )  
--mod(a,b) = modulus
--round(a) = rounding down or up
