# The tiling algorithm

Tiles make up a quad tree where every new zoom level divides the tile
boundaries of each tile of the previous level into for equal sized
quadrants.

Given certain screen bounds (the part of the world visible on the
screen currently) given in latitude and longitude, we need to
calculate what set of tiles to load. This requires us both to
calculate how many tiles to load, at what resolution / zoom level in
the quad tree, and their exact coordinates.

Apart from the screen bounds the algorithm takes a desired number of
tiles per screen to load. This number is neither a hard upper nor
lower limit, but a guide line.


* Input:
  * screenBounds
  * tilesPerScreen

* Output:
  * A set of tile bounds to load

* Steps:
  * Add / subtract 360 degrees to the sides of the screen bounds so that the right-hand side longitude > left hand side longitude

  * Calculate a zoomLevel = ceil(log(360 / (screenWidth/sqrt(tilesPerScreen)), 2))
  * Calculate a tileWidth = 360 / 2^zoomLevel
  * Calculate a tileHeight = 180 / 2^zoomLevel

  * Calculate the left most tile boundary, tileLeft = tileWidth * floor(screenBoundsLeft / tileWidth);
  * Calculate the right most tile boundary, tileRight = tileWidth * ceil(screenBoundsRight / tileWidth);
  * Similarly with top / bottom

  * For left in ]tileLeft,tileRight[, increment tileWidth do
    * For top in ]tileTop,tileBottom[, increment tileHeight do
      * Generate tile bound {left:left,top:top,right:left+tileWidth,bottom:top+tileHeight}

  * Add/subtract 360 degrees to the sides of each tile bound so that they are all in ]0,360[
