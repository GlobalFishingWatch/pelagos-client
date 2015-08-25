#! /usr/bin/env python

import sys
import os.path
import vectortile
import click
import json

last_series = 0
def generate_tile(outdir, bounds):
    global last_series
    series_group = last_series

    bbox = bounds.get_bbox()
    data = []
    for idx in xrange(0, 100):
        data.append({
                "seriesgroup": series_group,
                "series": last_series,
                "longitude": bbox.lonmin,
                "latitude": idx * (bbox.latmax - bbox.latmin) / 100.0 + bbox.latmin,
                "datetime": idx * 1000. * 60. * 60. * 24. * 30. / 100.,
                "weight": 1.0,
                "sigma": 0.0})
    last_series += 1
    for idx in xrange(0, 100):
        data.append({
                "seriesgroup": series_group,
                "series": last_series,
                "longitude": idx * (bbox.lonmax - bbox.lonmin) / 100.0 + bbox.lonmin,
                "latitude": bbox.latmin,
                "datetime": idx * 1000. * 60. * 60. * 24. * 30. / 100.,
                "weight": 1.0,
                "sigma": 0.0})
    last_series += 1

    with open(os.path.join(outdir, str(bounds.get_bbox())), "w") as f:
        f.write(str(vectortile.Tile.fromdata(data, {})))

def generate_tileset(outdir, levels=None):
    title = os.path.basename(outdir)

    if not os.path.exists(outdir):
        os.makedirs(outdir)

    def generate_tiles(bounds, level=0):
        generate_tile(outdir, bounds)
        if (    (levels is None or level < levels)
            and bounds.zoom_level < bounds.maxzoom):
            for child in bounds.get_children():
                generate_tiles(child, level+1)
    generate_tiles(vectortile.TileBounds())

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
                                   "sigma": {"max": 4711.,
                                             "type": "Float32",
                                             "min": 0.}},
                    "tilesetVersion": "1"
                    }))

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
                                    "title": title,
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


@click.command()
@click.argument("outdir", metavar="OUTDIR")
@click.option(
    '-l', '--levels', type=click.INT, default=None,
    help="Max levels (from the level of the bbox) to recurse"
)
@click.pass_context
def main(ctx, outdir, levels=None):
    generate_tileset(outdir, levels)
                    
if __name__ == "__main__":
    main()
