The number of animations, tiles per animation and rows per tile is
limited by the selection handling, which uses a 24bit color code to
identify an object. These 254 bits are divided up into:

* 4bits animation id
* 6bits tile id
* 14bits row id

This means

* A maximum of 16 animations
* Each animation having a maximum of 64 tiles loaded at any time
* Each tile having a maximum of 16384 rows of data


See js/app/Visualization/Animation/AnimationManager.js:getRowidxAtPos
for details.
