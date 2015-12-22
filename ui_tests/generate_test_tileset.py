#! /usr/bin/env python

import click
import _tileset
import datetime

class TimeType(click.ParamType):
    name = 'time'

    def convert(self, value, param, ctx):
        try:
            return datetime.datetime.strptime(value, _tileset.DATE_FORMAT)
        except ValueError:
            self.fail('%s is not a valid date' % value, param, ctx)

TIME_TYPE = TimeType()



@click.command()
@click.argument("outdir", metavar="OUTDIR")
@click.option(
    '-l', '--levels', type=click.INT, default=None,
    help="Max levels (from the level of the bbox) to recurse"
)
@click.option(
    '-s', '--start', type=TIME_TYPE, default=_tileset.EPOCH.strftime(_tileset.DATE_FORMAT),
    help="Start of time range. Default: 1970-01-01T00:00:00"
)
@click.option(
    '-e', '--extent', type=click.FLOAT, default=_tileset.DEFAULT_EXTENT,
    help="Length of each extent. Default %s" % _tileset.DEFAULT_EXTENT
)
@click.option(
    '-c', '--count', type=click.INT, default=None,
    help="Number of extents. A non-temporaly tiled tileset is generated if not specified."
)
@click.pass_context
def main(ctx, outdir, levels=None, start=_tileset.EPOCH, extent=_tileset.DEFAULT_EXTENT, count=None):
    _tileset.generate_tileset(outdir, levels, start, extent, count)

if __name__ == "__main__":
    main()
