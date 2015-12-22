import sys
import os.path
import vectortile
import click
import json
import datetime

DATE_FORMAT="%Y-%m-%dT%H:%M:%S"
DEFAULT_EXTENT=1000. * 60. * 60. * 24. * 30
EPOCH=datetime.datetime(1970,1,1)

def datetime2timestamp(d):
    return (d - EPOCH).total_seconds()

def generate_test_tileset():
    current_dir = os.path.dirname(__file__)
    test_tiles_dir = os.path.join(current_dir, 'data/testtiles')
    generate_tileset(test_tiles_dir, levels=3)

last_series = 0
def get_series_group():
    global last_series
    return last_series

def generate_tile(outdir, bounds, series_group, tile_bounds = None, time_range = None):
    global last_series

    if tile_bounds is None: tile_bounds = bounds
    filename = str(tile_bounds.get_bbox())

    if time_range is None:
        time_range = (0, DEFAULT_EXTENT)
    else:
        filename = "%s,%s;%s" % (time_range[0].strftime("%Y-%m-%dT%H:%M:%S"),
                                 time_range[1].strftime("%Y-%m-%dT%H:%M:%S"),
                                 filename)
        time_range = [datetime2timestamp(x) * 1000 for x in time_range]
    time_len = time_range[1] - time_range[0]

    bbox = bounds.get_bbox()
    data = []
    points = 100
    for idx in xrange(0, points):
        data.append({
                "seriesgroup": series_group,
                "series": last_series,
                "longitude": bbox.lonmin,
                "latitude": idx * (bbox.latmax - bbox.latmin) / float(points) + bbox.latmin,
                "datetime": time_range[0] + idx * time_len / float(points),
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
                "datetime": time_range[0] + idx * time_len / float(points),
                "weight": 20.0,
                "sog":20,
                "cog": 360.0 * round(8 * idx / float(points)) / 8.0,
                "sigma": 0.0})
        last_series += 1

    with open(os.path.join(outdir, filename), "w") as f:
        f.write(str(vectortile.Tile.fromdata(data, {})))

def generate_info(outdir, **info):
    with open(os.path.join(outdir, "info"), "w") as f:
        f.write(json.dumps(info))

def generate_header(outdir, title, time_min, time_max, temporalExtents=False):
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
                                   "datetime": {"min": datetime2timestamp(time_min) * 1000.,
                                                "max": datetime2timestamp(time_max) * 1000.,
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
                    "infoUsesSelection": True,
                    "temporalExtents": temporalExtents
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



def generate_tileset(outdir, levels=None, start=EPOCH, extent=DEFAULT_EXTENT, count=None):
    title = os.path.basename(outdir)
    time_min = start
    time_max = datetime.datetime.utcfromtimestamp(datetime2timestamp(start) + (count or 1) * extent / 1000.0)

    if not os.path.exists(outdir):
        os.makedirs(outdir)

    def generate_tiles(bounds, level=0):
        series_group = get_series_group()

        sub_outdir = os.path.join(outdir, "sub", "seriesgroup=%s" % series_group)
        if not os.path.exists(sub_outdir):
            os.makedirs(sub_outdir)
        generate_header(sub_outdir, "Track for %s" % series_group, time_min, time_max, count is not None)
        generate_info(
            sub_outdir,
            mmsi="%s" % series_group,
            callsign="SE%s" % series_group,
            vesselname=["Oden", "Tor", "Frej", "Loke", "Balder", "Freja", "Mimer"][series_group % 7])

        if count != None:
            for i in xrange(0, count):
                time_range = (datetime.datetime.utcfromtimestamp(datetime2timestamp(start) + extent * i / 1000.),
                              datetime.datetime.utcfromtimestamp(datetime2timestamp(start) + extent * (i+1) / 1000.))
                generate_tile(outdir, bounds, series_group, time_range=time_range)
                generate_tile(sub_outdir, bounds, series_group, vectortile.TileBounds(), time_range=time_range)
        else:
            generate_tile(outdir, bounds, series_group)
            generate_tile(sub_outdir, bounds, series_group, vectortile.TileBounds())

        if (    (levels is None or level < levels)
            and bounds.zoom_level < bounds.maxzoom):
            for child in bounds.get_children():
                generate_tiles(child, level+1)
    generate_tiles(vectortile.TileBounds())

    generate_header(outdir, title, time_min, time_max, count is not None)
    generate_workspace(outdir, title)

