# The tiling algorithm

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
