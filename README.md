# ECHOLocator

Website to explore Choice Neighborhoods in the Boston area.

[![Build Status](https://travis-ci.com/azavea/echo-locator.svg?branch=develop)](https://travis-ci.com/azavea/echo-locator)

## Requirements

### To run within a Docker container:

* Docker Engine 17.06+
* Docker Compose 1.6+

### To run directly:

* node
* yarn


## Development

To start developing, create a set of Taui environment variables for development:

```
$ cp taui/configurations/default/env.yml.tmp taui/configurations/default/env.yml
```

Make sure to edit `env.yml` to set the appropriate secrets for development.

Next, move the AWS Amplify JavaScript configuration for the staging environment
into the Taui source code:

```
$ cp deployment/amplify/staging/aws-exports.js taui/src/aws-exports.js
```

### Optional step for local deployment

To deploy or manage deployment resources, on your host machine you will need to set up an `echo-locator` profile for the AWS account using the following command:
```bash
$ aws configure --profile echo-locator
```

### Running with Docker

Finally, use the `server` script to build container images, compile frontend assets,
and run a development server:

```
$ ./scripts/server
```

### Running directly

* `cd taui`
* Install packages: `yarn add`
* Build and run development server: `yarn start`


Navigate to http://localhost:9966 to view the development environment.

## Data

In the `neighborhood_data` directory are data sources and management scripts to transform them. The app uses two GeoJSON files generated by the scripts for neighborhood point and bounds data.

The `neighborhoods.csv` file is the source file for data on the neighborhoods, organized by zip code. The `add_zcta_centroids.py` script downloads Census Zip Code Tabulation Area (ZCTA) data, looks up the zip codes from `neighborhoods.csv`, and writes two files. One is `neighborhood_centroids.csv`, which is the input file content with two new columns added for the coordiates of the matching ZCTA's centroid (approximate center). The other is `neighborhood_bounds.json`, a GeoJSON file of the bounds of the ZCTAs marked as ECC in `neighborhoods.csv`.

To run the script to get ZCTA centroids and bounds:

 - `cd neighborhood_data`
 - `pip install -r requirements.txt`
 - `./add_zcta_centroids.py`

The `generate_neighborhood_json.py` script expects the `add_zcta_centroids.py` script to have already been run. It transforms the `neighborhood_centroids.csv` data into GeoJSON and writes it to `neighborhoods.json`.

To update the data used by the app with what the scripts generate:

 - `cp neighborhood_data/neighborhoods.json neighborhood_data/neighborhood_bounds.json taui/`


## Testing

Run linters and tests with the `test` script:

```
$ ./scripts/test
```

## Deployment

CI will deploy frontend assets to staging on commits to the `develop` branch,
and will deploy to production on commits to the `master` branch.

For instructions on how to update core infrastructure, see the [README in the
deployment directory](./deployment/README.md).
