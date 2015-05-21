# Tileset schema

The tileset schema consists of a stack of schemas:

* Tile binary file format (documented [here](https://github.com/SkyTruth/data-visualization-tools/blob/master/js/app/Data/TypedMatrixParser.js))
* The tileset URL structure
* The tileset header
  * The animation column mapper configuration
* The workspace specification
* The animation specific schemas
  * Configuration options for workspace file
  * Column schemas


A data source for an animation can either be a single tile file (given by its URL), or a tileset with header following the tileset URL structure, given as a base URL.

# The tileset URL structure
## Header
A tileset always has a header file under the base url:

    http://myproject.appspot.com/tile/mytileset/header

## Fallback URLS
The header file can the specify a set of new base url:s to use for tile fetches as well as track queries.

The base urls are specified as a list of fallback levels. For each level there can be multiple urls, used in a round-robin fashion. The client starts by trying to load a tile using the lowest fallback level. If a request returns a 404 error, the next higher fallback level is attempted, until all are exhausted.

This allows you to deploy a pre-generated set of tiles for low zoom levels to a static serving host, while dynamically filling in that set for the higher zoom levels.

## Tiles
Tiles are loaded from under any of the provided fallback urls by adding the tile bounding box:

    http://myproject.appspot.com/tile/mytileset/135,-11.25,157.5,0

For information on the exact details of how bounds are calculated, look at [tileParamsForRegion()](https://github.com/SkyTruth/data-visualization-tools/blob/master/js/app/Data/BaseTiledFormat.js#L188).

## Series lookup
Whenever a user does a selection, a POST is made to

    http://myproject.appspot.com/tile/mytileset/series

with selection information. It should return a JSON structure that will be rendered as an information table for the user.

# The tileset header
The tileset header specifies how to load tiles, and what columns to expect.

    {
      "tilesetName": "Default name for animation", 

      /* Urls to load tiles from. Each entry in the list is a fallback level (ordered from first level to attempt to last).
         Each level is a list of urls to try in a round-robin fashion.
      */
      "urls": [
        [
          "http://storage.googleapis.com/myproject/tiles/mytileset-3.2.4"
        ], 
        [
          "http://t0.myproject.appspot.com/tiles/mytileset/3.2.4", 
          "http://t1.myproject.appspot.com/tiles/mytileset/3.2.4", 
          "http://t2.myproject.appspot.com/tiles/mytileset/3.2.4", 
          "http://t3.myproject.appspot.com/tiles/mytileset/3.2.4"
        ]
      ],

      /* Column specifications. Note: All tiles should adhere to this
         format, or extend it. Extra columns in tiles will be mostly
         ignored. Maps a column name to a specification containing column
         type, min and max values, and opptional configuration for the
         column mapper editor.
     */

      "colsByName": {
        "datetime": {
          "type": "Float32",
          "min": 1414799949824.0,
          "max": 1425168007168.0, 
          "hidden": true /* Don't show in animation editor interface */
        }
      }, 
    }

# The workspace secification
A workspace is a JSON file loadable from a URL. If the URL contains a query ?id=SOMEID, then the url without the query will be used to save new workspaces to using a POST request.

    {
      "state": {
        "title": "Window title", 

        /* Time window end */
        "time": {"__jsonclass__": ["Date", "2015-03-01T00:00:07.168Z"]}, 
        /* Time window size in milliseconds */
        "timeExtent": 10368057344, 

        /* Screen center and zoom, google maps semantics */
        "lon": -169.69070434570312, 
        "lat": -7.453709339338128, 
        "zoom": 4, 

        /* Animation state */
        "paused": true, 
        "loop": true,
      },
      "map": {
        /* Google maps styling and other options */
        "options": {
          "mapTypeId": "roadmap", 
          "styles": [
            {"featureType": "road", "stylers": [{"visibility": "off"}]}
          ]
        },

        /* Overlay animation confirguration. For more information see the documentation for each animation type. */
        "animations": [
          {
            "title": "My animation"
            "type": "MapsEngineAnimation"
            "args": {
              "color": "green", 
              "source": {
                "args": {
                  "url": "06136759344167181854-01329948687802613844"
                }, 
                "type": "BinFormat"
              }, 
              "visible": true, 
              "hideremovebtn": true, 
            }, 
          }
        ]
      }
    }

# The column schemas
