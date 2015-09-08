# The spatial tiling algorithm

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


# Temporal tiling

## Design criterion

* Load more sparse data / clustered data when
  * a large temporal window is selected
  * a large spatial window is selected
* Load more dense data / raw data when
  * a small temporal window is selected
  * a small spatial window is selected
* Not having to produce all combinations of all time ranges and all spatial extents

## Brief outline or algorithm

* There is only one temporal slice / tile length - 1 month
* There are spatial tile sizes ranging from the whole world to very small regions, making a qaud-tree.
* "Zoom level" for spatial tiles depend both on actual spatial zoom and temporal zoom.

* Number of spatial tiles to load
  * Given the length of the temporal window, calculate the number of needed temporal slices by dividing it by 31 days
  * The number of spatial tiles to load is the wanted tiles per screen divided by the number of needed temporal slices.

* Temporal slices to load
  * Move the start of the window back to the nearest preceding month boundary
  * Move the end of the window forward to the nearest following month boundary
  * Make a list of the months between those two dates

* Spatial tiles to load
  * Calculate the spatial tile boundaries to load using [the standard algorithm](https://github.com/SkyTruth/pelagos-client/blob/master/docs/tiling.md) for that with tilesPerScreen set to the number of spatial tiles to load calculated above

* Tiles to load
  * Load each combination of a spatial tile bound and a temporal slice calculated above

