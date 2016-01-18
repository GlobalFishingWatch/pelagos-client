# Tileset schema

The workspace is the highest configuration item for the system. It represents the whole state of what the user is currently viewing. The workspace defines a set of animations. Each animation has a data source and some configuratation. A data source for an animation can either be a single tile file given by its URL or a tileset directory following the tileset URL structure, given as a base URL.

This schema document describes the schemas for each part in this stack:

* Tile binary file format (documented [here](https://github.com/SkyTruth/pelagos-client/blob/master/js/app/Data/TypedMatrixParser.js))
* The tileset URL structure
* The tileset header
* The workspace specification
  * Animation configuration
* The animation specific schemas
  * Configuration options for workspace file
  * Column schemas


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

For information on the exact details of how bounds are calculated, look at [tileParamsForRegion()](https://github.com/SkyTruth/pelagos-client/blob/master/js/app/Data/BaseTiledFormat.js#L188).

## Queries

A tileset can provide subset tilesets or information for queries. Queries are made up of one or more columnname=value pairs separated by commas, one for each sortcol (see the section on selections below for information about sortcols). If the main tileset resides under

    http://myproject.appspot.com/tile/mytileset/

the subset tileset will reside under 

    http://myproject.appspot.com/tile/mytileset/sub/columnname1=value1,columnname2=value2.../

and detailed information about the selection in a json file under 

    http://myproject.appspot.com/tile/mytileset/sub/columnname1=value1,columnname2=value2.../info

The info json file should contain a json structure with name: value pairs that will be rendered as an information table for the user.

Special rendering for AIS vessel information will be done if the structure contains any of the fields vesselname, mmsi, imo or callsign.

In all other cases, fields will be rendered as two columns, names and values. If a field named *name* is present, it will be used as a header, and if a field named *link* is present, the title will be made into a link pointing to this value (which must be an URL). Fields whose values are URLs will be rendered as links (and the value column left blank).

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

      /* Default is to query /info/series/SERIESNR for selection
         information (it should return json). If set to true, sortcols
         from the selection object is used to determine the path:
         /info/NAME1/VALUE1/NAME2/VALUE2.../NAMEN/VALUEN */

      infoUsesSelection: false,

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
      
      /* Wether this tileset has subset tilesets for series / seriesgroupp queries */
      seriesTilesets: true
    }

# Choices

Columns that only contain a discrete number of different values can be used to produce a drop-down menu that allows the user to select/display a subset of the points sharing a certain value. See the section on selections below for more information on this.

Labels for such a menu should be added to the column specification under colsByName:

      "colsByName": {
        "category": {
          "type": "Float32",
          "min": -1.0,
          "max": 2.0, 
          "choices": {
            "Unknown": -1.0
            "Chocolate": 0.0,
            "Vanilla": 1.0,
            "Strawberry": 2.0
          }
        }
      },

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

        /* Overlay animation confirguration. See below. */
        "animations": []
      }
    }

## Animaton configuration

Animations represents layers of data overlaid on the basemap. Each animation visualizes some source data. There is no hard-coded schema for source data. Instead, the animation configuration dynamically maps source data to the values needed by the visualization. The user may also dynamically change this mapping using sliders or buttons in the editing UI or a custom UI.

Each animation definition contains a title, a type and a set of arguments. The arguments contain at least a source definition, with a source type and loader arguments.

    {
      "title": "My animation"
      "type": "MyAnimationClass"
      "visible": true, /* Visibility checkbox status */
      "args": {
        /* Source configuration, see below */
        "source": {}
        }

        /* Not all animation classes supports these. See below for specification. */
        "uniforms": {},
        "columns": {},
        "selections": {}
      }
    }

### Animation source configuration

The animation data source can be either a tileset:

    {
      "type": "TiledBinFormat",
      "args": {
        "url": "http://myproject.appspot.com/tile/mytileset"
      }
    }

or a single tile file:

    {
      "type": "BinFormat"
      "args": {
        "url": "http://myproject.appspot.com/file.bin"
      }
    }

### Uniforms
Uniforms are simple slider values input to the animation. They are defined as a mapping from names to min-max-current specifications. Each animation defines what uniforms it needs and possible value ranges.

    "uniforms": {
      "blue": {
        "value": 0.4, 
        "max": 1, 
        "min": 0
      }
    }

### Columns
Column specifications map data source columns and selections to animation columns. Each column consist of a name, a type, a min value and a max value that each needs to correspond to the requirements of the animation class, and a source polynomial.

The source polynomial is represented as a mapping from source column names and selection names to values. The values represent the constant factors in front of each source variable in the polynomial. The special source name "_" represents the constant term in the polynomial. For example the polynomial weight = 0.4*speed + 0.4*size+0.2*1 is represented as

    "columns": {
      "weight": {
        "type": "Float32", 
        "source": {
          "speed": 0.4,
          "size": 0.4,
          "_": 0.2
        }, 
        "max": 1, 
        "min": 0
      }
    }

There is also a special "magic" constant value null, that represents the number of variable polynomial terms. This is intended to easily represent logical and. For example the logical expression not (timerange and active_category) can be represented using the polynomial filter = -1*timerange + -1*active_category + 2 (with 0 = False and 1 = True):

    "columns": {
      "filter": {
        "type": "Float32"
        "source": {
          "timerange": -1, 
          "active_category": -1, 
          "_": null
        }
      }, 
    }

### Selections
Selections represent ways the user can select subsets of points to highlight them or query information about them. The set of available  selections is hard-coded to info,hover,selected,timerange and active_category. These represent points queried for information by a right-click, points hovered over with the mouse, points selected  by a left click, points currently in view based on the timeslider and points selected by a point category filter respectively.

Selection are defined as:

    "selections": {
      "selected": {
        "header": {"length": 0}, 
        "data": {"seriesgroup": []}, 
        "sortcols": ["seriesgroup"]
      }
    }

sortcols contains one or more data source column names. The selection can represent a range of input data whose values lie between two extremes for each sortcol. Even a range where the upper and lower bound are the same can contain multiple points, if not all data source columns are listed in sortcols.

The default sortcols is ["seriesgroup"] for all selections apart from active_category, for which it is ["category"].

data and header contains values representing a current selection. It is recommended to generate these values by loading the workspace, changing the selections and then saving the workspace.

# Generic column specification

* series - track id for track drawing animations
* timestamp - timestamp for the "timerange" selection

# ClusterAnimation

* filter - 0 or below to draw point, above 0 hides point
* latitude - coordinate for point in wgs84
* longitude - coordinate for point in wgs84
* sigma - standard deviation of points inside a cluster represented by a single point in meters.
* weight - luminosity of point, between 0 and 1
* red - between 0 and 1, color for top luminosity
* green - between 0 and 1, color for top luminosity
* blue - between 0 and 1, color for top luminosity
* selected_red - between 0 and 1, color for top luminosity for selected points
* selected_green - between 0 and 1, color for top luminosity for selected points
* selected_blue - between 0 and 1, color for top luminosity for selected points
* hover_red - between 0 and 1, color for top luminosity for points hovered over
* hover_green - between 0 and 1, color for top luminosity for points hovered over
* hover_blu - between 0 and 1, color for top luminosity for points hovered over

## Standard configuration

If points are to be grouped in larger units than single tracks e.g. all tracks for the same vessel, it is recommended to add a column caled seriesgroup with a unique value for each such vessel.
