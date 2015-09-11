#! /usr/bin/env python

import click
import _tileset

@click.command()
@click.argument("outdir", metavar="OUTDIR")
@click.option(
    '-l', '--levels', type=click.INT, default=None,
    help="Max levels (from the level of the bbox) to recurse"
)
@click.pass_context
def main(ctx, outdir, levels=None):
    _tileset.generate_tileset(outdir, levels)

if __name__ == "__main__":
    main()
