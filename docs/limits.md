# Limits for a dataset

  * A maximum of 256 animations
  * Each animation having a maximum of 65536 tiles loaded at any time
  * Each tile having a maximum of 16777216 rows of data

The last tile (with id 255) of the last animation (with id 65535) can
only hold 16777215 rows, not 16777216.


# Reasons for the limits

The number of animations, tiles per animation and rows per tile is
limited by the selection handling, which uses pixel colors of two
canvases to identify objects.

The alpha channel can't easily be used for encoding parts of an object
id due to how blending is handled (FIXME: Sort this out so we get 16
bits more!). This means that we have 3 bytes per canvas (red, green
and blue), in total 6 bytes.

These 6 bytes (48 bites) are distributed according to the following
list:

  * 8bits animation id
  * 16bits tile id
  * 24bits row id

In addition, the value with all bits set to 1 is used to signal "no
object".

For details see

  * js/app/Visualization/Animation/AnimationManager.js:getRowidxAtPos
  * app/Visualization/Animation/rowidx.glsl:rowidxColor
  * app/Visualization/Animation/Rowidx.js:pixelToId