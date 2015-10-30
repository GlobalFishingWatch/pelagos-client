import sys
import os.path
import vectortile
import click
import json

def generate_test_tileset():
    current_dir = os.path.dirname(__file__)
    test_tiles_dir = os.path.join(current_dir, 'data/testtiles')
    generate_tileset(test_tiles_dir, levels=3)

last_series = 0
def generate_tile(outdir, bounds, series_group = None, tile_bounds = None):
    global last_series
    
    if series_group is None: series_group = last_series

    bbox = bounds.get_bbox()
    data = []
    points = 100
    for idx in xrange(0, points):
        data.append({
                "seriesgroup": series_group,
                "series": last_series,
                "longitude": bbox.lonmin,
                "latitude": idx * (bbox.latmax - bbox.latmin) / float(points) + bbox.latmin,
                "datetime": idx * 1000. * 60. * 60. * 24. * 30. / float(points),
                "weight": 20.0,
                "sog":20,
                "cog": 360.0 * round(8 * idx / float(points)) / 8.0,
                "sigma": 0.0})
        last_series += 1
    for idx in xrange(0, points):
        data.append({
                "seriesgroup": series_group,
                "series": last_series,
                "longitude": idx * (bbox.lonmax - bbox.lonmin) / float(points) + bbox.lonmin,
                "latitude": bbox.latmin,
                "datetime": idx * 1000. * 60. * 60. * 24. * 30. / float(points),
                "weight": 20.0,
                "sog":20,
                "cog": 360.0 * round(8 * idx / float(points)) / 8.0,
                "sigma": 0.0})
        last_series += 1

    if tile_bounds is None: tile_bounds = bounds
    with open(os.path.join(outdir, str(tile_bounds.get_bbox())), "w") as f:
        f.write(str(vectortile.Tile.fromdata(data, {})))

    return series_group

def generate_info(outdir, **info):
    with open(os.path.join(outdir, "info"), "w") as f:
        f.write(json.dumps(info))

def generate_header(outdir, title):
    with open(os.path.join(outdir, "header"), "w") as f:
        f.write(json.dumps({
                    "tilesetName": title,
                    "colsByName": {"seriesgroup": {"max": 4711.,
                                                   "type": "Float32",
                                                   "min": 0.},
                                   "series": {"max": 4711.,
                                              "type": "Float32",
                                              "min": 0.},
                                   "longitude": {"min": -180.,
                                                 "max": 180.,
                                                 "hidden": True,
                                                 "type": "Float32"},
                                   "latitude": {"min": -90.,
                                                "max": 90.,
                                                "hidden": True,
                                                "type": "Float32"},
                                   "datetime": {"min": 0.,
                                                "max": 1000. * 60. * 60. * 24. * 30.,
                                                "hidden": True,
                                                "type": "Float32"},
                                   "weight": {"max": 4711.,
                                              "type": "Float32",
                                              "min": 0.},
                                   "sog": {"max": 30.,
                                           "type": "Float32",
                                           "min": 0.},
                                   "cog": {"max": 360.,
                                           "type": "Float32",
                                           "min": 0.},
                                   "sigma": {"max": 4711.,
                                             "type": "Float32",
                                             "min": 0.}},
                    "tilesetVersion": "1",
                    "seriesTilesets": True,
                    "infoUsesSelection": True
                    }))

def generate_workspace(outdir, title):
    with open(os.path.join(outdir, "workspace"), "w") as f:
        f.write(json.dumps({
                    "state": {
                        "title": title,
                        "offset": 20,
                        "maxoffset": 100,
                        "lat": 0.,
                        "lon": 0.,
                        "zoom":4,
                        "time":{"__jsonclass__":["Date","1970-01-15T00:00:00.000Z"]},
                        "timeExtent": 1000. * 60. * 60. * 24. * 15.,
                        "paused":True
                        },
                    "map": {
                        "animations": [
                            {
                                "args": {
                                    "title": 'Clusters',
                                    "visible": True,
                                    "source": {
                                        "type": "TiledBinFormat",
                                        "args": {
                                            "url": "."
                                            }
                                        },
                                    "selections": {
                                        "selected": {
                                            "sortcols": ["seriesgroup"]
                                                },
                                        "hover": {
                                            "sortcols": ["seriesgroup"]
                                            }
                                        }
                                    },
                                "type": "ClusterAnimation"
                                },
                            {
                                "args": {
                                    "title": 'Arrows',
                                    "visible": True,
                                    "source": {
                                        "type": "TiledBinFormat",
                                        "args": {
                                            "url": "."
                                            }
                                        },
                                    "selections": {
                                        "selected": {
                                            "sortcols": ["seriesgroup"]
                                                },
                                        "hover": {
                                            "sortcols": ["seriesgroup"]
                                            }
                                        }
                                    },
                                "type": "ArrowAnimation"
                                }
                            ],
                        "options": {
                            "mapTypeId": "roadmap",
                            "styles": [
                                {
                                    "featureType": "poi",
                                    "stylers": [
                                        {
                                            "visibility": "off"
                                            }
                                        ]
                                    },
                                {
                                    "featureType": "administrative",
                                    "stylers": [{ "visibility": "simplified" }]
                                    },
                                {
                                    "featureType": "administrative.country",
                                    "stylers": [
                                        { "visibility": "on" }
                                        ]
                                    },
                                {
                                    "featureType": "road",
                                    "stylers": [
                                        { "visibility": "off" }
                                        ]
                                    },
                                {
                                    "featureType": "landscape.natural",
                                    "stylers": [
                                        { "visibility": "off" }
                                        ]
                                    }
                                ]
                            }
                        }
                    }))



def generate_tileset(outdir, levels=None):
    title = os.path.basename(outdir)

    if not os.path.exists(outdir):
        os.makedirs(outdir)

    def generate_tiles(bounds, level=0):
        series_group = generate_tile(outdir, bounds)
        sub_outdir = os.path.join(outdir, "sub", "seriesgroup=%s" % series_group)
        if not os.path.exists(sub_outdir):
            os.makedirs(sub_outdir)
        generate_tile(sub_outdir, bounds, series_group, vectortile.TileBounds())
        generate_header(sub_outdir, "Track for %s" % series_group)
        generate_info(
            sub_outdir,
            mmsi="%s" % series_group,
            callsign="SE%s" % series_group,
            vesselname=["Oden", "Tor", "Frej", "Loke", "Balder", "Freja", "Mimer"][series_group % 7])

        if (    (levels is None or level < levels)
            and bounds.zoom_level < bounds.maxzoom):
            for child in bounds.get_children():
                generate_tiles(child, level+1)
    generate_tiles(vectortile.TileBounds())

    generate_header(outdir, title)
    generate_workspace(outdir, title)

