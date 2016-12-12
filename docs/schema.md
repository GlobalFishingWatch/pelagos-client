---
---

# Tileset schema

The workspace is the highest configuration item for the system. It represents
the whole state of what the user is currently viewing. The workspace defines a
set of animations. Each animation has a data source and some configuratation. A
data source for an animation can either be a single tile file given by its URL
or a tileset directory following the tileset URL structure, given as a base
URL.

This schema document describes the schemas for each part in this stack:

* Tile binary file format (documented
  [here](https://github.com/SkyTruth/pelagos-client/blob/master/js/app/Data/TypedMatrixParser.js))
* The tileset URL structure
* The tileset header
* The workspace specification
  * Animation configuration
* The animation specific schemas
  * Configuration options for workspace file
  * Column schemas

Most objects in this stack are represented as JSON objects. The schema
presented here only specifies a minimum set of required keys and their
interpretations, and allows for additional keys to be present in all
structures without causing an error. In most places additional keys
are preserved across a worspace load/save. In particular this is true
for the "args" member of animation specifications.


# The tileset URL structure

## Header

A tileset always has a JSON format header file under the base url
specifying how to interpret the tileset:

```
http://myproject.appspot.com/tile/mytileset/header
```

It might also have a JSON format info file describing the tileset
content to humans:

```
http://myproject.appspot.com/tile/mytileset/info
```


## Fallback URLS

The header file can the specify a set of new base url:s to use for tile fetches
as well as selection info and selection track queries.

The base urls are specified as a list of fallback levels. For each level there
can be multiple urls, used in a round-robin fashion. The client starts by
trying to load a tile using the lowest fallback level. If a request returns a
404 error, the next higher fallback level is attempted, until all are
exhausted.

This allows you to deploy a pre-generated set of tiles for low zoom levels to a
static serving host, while dynamically filling in that set for the higher zoom
levels.

## Tiles

Tiles are loaded from under any of the provided fallback urls by adding the tile bounding box:

```
http://myproject.appspot.com/tile/mytileset/135,-11.25,157.5,0
```

Alternatively, if you're using temporal tiling a time range and a bounding box:

```
http://myproject.appspot.com/tile/mytileset/2014-12-06T00:00:00,2015-01-05T00:00:00;-180,0,-168.75,5.625
```

The time range is specified on the format YYYY-MM-DDThh:mm:ss.ddd (ddd is
second decimals). Start should be a time which when represented as a unix
timestamp, is divisible by temporalExtents. End should be start +
temporalExtents.

Alternatively, you can specify temporalExtentsBase as a unix
timestamp. This value is then subtracted from the time range start
value before testing for divisibility by temporalExtents.

For information on the exact details of how bounds are calculated, look at
[tileParamsForRegion()](https://github.com/SkyTruth/pelagos-client/blob/master/js/app/Data/TileBounds.js#L6).

## Queries

A tileset can provide subset tilesets or information for queries. Queries are
made up of one or more columnname=value pairs separated by commas, one for each
sortcol (see the section on selections below for information about sortcols).
If the main tileset resides under

```
http://myproject.appspot.com/tile/mytileset/
```

the subset tileset will reside under

```
http://myproject.appspot.com/tile/mytileset/sub/columnname1=value1,columnname2=value2.../
```

The format of the tileset is the same as for the main tileset. It must
have a header file and might have an info file

```
http://myproject.appspot.com/tile/mytileset/sub/columnname1=value1,columnname2=value2.../header
http://myproject.appspot.com/tile/mytileset/sub/columnname1=value1,columnname2=value2.../info
```

# The tileset header

The tileset header specifies how to load tiles, and what columns to expect.

```
{
  "tilesetName": "Default name for animation",

  /* Urls to load files from for different purposes.

     Each entry in the list is a fallback level (ordered from
     first level to attempt to last). Each level is a list of urls
     to try in a round-robin fashion.

     Setting urls to a list of lists, instead of an object, is a
     shortcut syntax for only setting the "default" member. */
  "urls": {
    "default": [
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
    "selection-info": [
      [
        "http://storage.googleapis.com/myproject/vesseltracks"
      ]
    ]
  },

  /* Default is to query /info/series/SERIESNR for selection
     information (it should return json). If set to true, sortcols
     from the selection object is used to determine the path:
     /info/NAME1/VALUE1/NAME2/VALUE2.../NAMEN/VALUEN */

  "infoUsesSelection": false,

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
  "seriesTilesets": true,

  /* If set to a numeric value temporal tiling will be enabled,
     and the value specifies the length (in milliseconds) of a
     temporal tile. */
  "temporalExtents": 2592000000,
}
```

# Choices

Columns that only contain a discrete number of different values can be used to
produce a drop-down menu that allows the user to select/display a subset of the
points sharing a certain value. See the section on selections below for more
information on this.

Labels for such a menu should be added to the column specification under
colsByName:

```
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
}
```

An optional interpretation of the labels can be supplied:

```
"colsByName": {
  "category": {
    "type": "Float32",
    "min": -1.0,
    "max": 2.0,
    "choices_type": "ISO 3166-1 alpha-2",
    "choices": {
      "SE": 0.0,
      "FI": 1.0,
      "DK": 2.0
      "IS": 3.0
      "NO": 4.0
    }
  }
}
```

# The tileset info

The optional info file describes the tileset content to a human user.
For example, given a main tileset containing AIS data from fishing
vessels, it might say this, and go on to describe the limitations of
AIS reception and the possibility for spoofing. Info files for sub
tilesets containing individual vessel tracks, could then describe the
vessel, listing its name, callsign, mmsi etc.

The format of the info file is JSON and it should contain a top level
object. It is rendered to HTML as following:

* If the key "title" exists, its value is rendered as a h1 tag, window
  title or similar.
* If the key "description" exists, its value is rendered below the title.
* If the key "footer" exists, its value is rendered at the bottom
  below all other content.
* If any other keys exists, a two column table is rendered between the
  description and footer, with keys in the left column and their
  corresponding value in the right column.

Values are rendered as following:

* A string value for a key containing "time" or "date" are parsed using
  new Date() and rendered in a standard date/time format.
* A string containing a '&lt;' character is considered HTML and is
  rendered verbatim.
* A string that is not considered HTMl, but contains the substring
  '://' is considered a URL link. An optional link title can preceede
  the URL separated by a space character.
* Any other string is just rendered as text.
* Objects are rendered recursively using the same algorithm as the
  main object of the file (so you can have key/value pair tables
  inside each other).


# The workspace secification

A workspace is a JSON file with the following schema:

```
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
  },
  "data" {
    "directories": [
      /* Searchable directories of layers that can be added to the
         workspace */
      "http://localhost/v1/directory"
    ]
  },
  "metadata": {
    /* Workspace metadata */
    "id":"my-workspace.json",
    "urls": {
      /* URL to POST new workspaces to to save them */
      "save":"http://localhost/v1/workspaces",
      "load":"http://localhost/v1/workspaces/my-workspace.json",
      /* This URL should load the visualization client with the
         current workspace. Might load it inside an iframe with
         additional surrounding content. */
      "visualization":"http://localhost/map/workspace/my-workspace.json"
    }
  }
}
```

## Animaton configuration

Animations represents layers of data overlaid on the basemap. Each animation
visualizes some source data. There is no hard-coded schema for source data.
Instead, the animation configuration dynamically maps source data to the values
needed by the visualization. The user may also dynamically change this mapping
using sliders or buttons in the editing UI or a custom UI.

Each animation definition contains a title, a type and a set of arguments. The
arguments contain at least a source definition, with a source type and loader
arguments.

```
{
  "type": "MyAnimationClass"

  "args": {

    "title": "My animation"

    /* Visibility checkbox status */
    "visible": true,

    /* If true, reports will be enabled on this animation. */
    "report": true,

    /* Source configuration, see below */
    "source": {},

    /* Not all animation classes supports these. See below for specification. */
    "uniforms": {},
    "columns": {},
    "selections": {}
  }

}
```

### Animation source configuration

The animation data source can be either a tileset:

```
{
  "type": "TiledBinFormat",
  "args": {
    "url": "http://myproject.appspot.com/tile/mytileset"
  }
}
```

or a single tile file:

```
{
  "type": "BinFormat"
  "args": {
    "url": "http://myproject.appspot.com/file.bin"
  }
}
```

#### Special note about CartoDB 

There is an animation type called CartoDBAnimation that renders a
CartoDB layer. This animation type requires the source type
CartoDBFormat.

```
{
  "type": "CartoDBFormat"
  "args": {
    "url": "http://cartodb.myproject.com/mylayer/viz.json"
  }
}
```

As the CartoDB layer description field has various limitations, and is
rendered from a Markdown-inspired mini-language, there is a special
mechanism to load the equivalent of the header and info files for
tilesets, triggered by the description containing a link with the
title "Metadata". If no such link exists, the description text (as
rendered to HTML) is used as info.description, and the CartoDB layer
title is used as info.title. If the Metadata link is present, it
should point to a JSON file with an object containing two keys: info
and header. Their values should be the info and header structures as
described above, respectively.

### Uniforms

Uniforms are simple slider values input to the animation. They are defined as a
mapping from names to min-max-current specifications. Each animation defines
what uniforms it needs and possible value ranges.

```
"uniforms": {
  "blue": {
    "value": 0.4,
    "max": 1,
    "min": 0
  }
}
```

### Columns

Column specifications map data source columns and selections to animation
columns. Each column consist of a name, a type, a min value and a max value
that each needs to correspond to the requirements of the animation class, and a
source polynomial.

The source polynomial is represented as a mapping from source column names and
selection names to values. The values represent the constant factors in front
of each source variable in the polynomial. The special source name `_`
represents the constant term in the polynomial. For example the polynomial
`weight = 0.4*speed + 0.4*size+0.2*1` is represented as

```
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
```

There is also a special "magic" constant value null, that represents the number
of variable polynomial terms. This is intended to easily represent logical and.
For example the logical expression not (timerange and active_category) can be
represented using the polynomial filter = -1*timerange + -1*active_category + 2
(with 0 = False and 1 = True):

```
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
```

### Selections

Selections represent ways the user can select subsets of points to highlight
them or query information about them. The set of available  selections is
hard-coded to info,hover,selected,timerange and active_category. These
represent points queried for information by a right-click, points hovered over
with the mouse, points selected  by a left click, points currently in view
based on the timeslider and points selected by a point category filter
respectively.

Selection are defined as:

```
"selections": {
  "selected": {
    "header": {"length": 0},
    "data": {"seriesgroup": []},
    "sortcols": ["seriesgroup"]
  }
}
```

sortcols contains one or more data source column names. The selection can
represent a range of input data whose values lie between two extremes for each
sortcol. Even a range where the upper and lower bound are the same can contain
multiple points, if not all data source columns are listed in sortcols.

The default sortcols is ["seriesgroup"] for all selections apart from
active_category, for which it is ["category"].

data and header contains values representing a current selection. It is
recommended to generate these values by loading the workspace, changing the
selections and then saving the workspace.

# Generic column specification

* `series` - track id for track drawing animations
* `timestamp` - timestamp for the "timerange" selection

# ClusterAnimation

* `filter` - 0 or below to draw point, above 0 hides point
* `latitude` - coordinate for point in wgs84
* `longitude` - coordinate for point in wgs84
* `sigma` - standard deviation of points inside a cluster represented by a single point in meters.
* `weight` - luminosity of point, between 0 and 1
* `red` - between 0 and 1, color for top luminosity
* `green` - between 0 and 1, color for top luminosity
* `blue` - between 0 and 1, color for top luminosity
* `selected_red` - between 0 and 1, color for top luminosity for selected points
* `selected_green` - between 0 and 1, color for top luminosity for selected points
* `selected_blue` - between 0 and 1, color for top luminosity for selected points
* `hover_red` - between 0 and 1, color for top luminosity for points hovered over
* `hover_green` - between 0 and 1, color for top luminosity for points hovered over
* `hover_blu` - between 0 and 1, color for top luminosity for points hovered over

## Standard configuration

If points are to be grouped in larger units than single tracks e.g. all tracks
for the same vessel, it is recommended to add a column caled seriesgroup with a
unique value for each such vessel.
