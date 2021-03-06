// @flow
import lonlat from '@conveyal/lonlat'
import Leaflet from 'leaflet'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import React, {PureComponent} from 'react'
import "react-responsive-carousel/lib/styles/carousel.min.css"
import { Carousel } from 'react-responsive-carousel'

import {
  Map as LeafletMap,
  Marker,
  Popup,
  TileLayer,
  ZoomControl
} from 'react-leaflet'

import {NEIGHBORHOOD_ACTIVE_BOUNDS_STYLE} from '../constants'
import type {
  Coordinate,
  Location,
  LonLat,
  MapEvent
} from '../types'

import DrawNeighborhoodBounds from './draw-neighborhood-bounds'
import DrawRoute from './draw-route'
import VGrid from './vector-grid'

const TILE_URL = Leaflet.Browser.retina && process.env.LEAFLET_RETINA_URL
  ? process.env.LEAFLET_RETINA_URL
  : process.env.LEAFLET_TILE_URL

const LABEL_URL = Leaflet.Browser.retina && process.env.LABEL_RETINA_URL
  ? process.env.LABEL_RETINA_URL
  : process.env.LABEL_URL

const TILE_OPTIONS = {
  attribution: process.env.LEAFLET_ATTRIBUTION,
  tileSize: 512,
  zoomOffset: -1
}

const iconWidth = 20
const iconHeight = 20
const iconSize = [iconWidth, iconHeight]
const iconAnchor = [iconWidth / 2, iconHeight + 13] // height plus the pointer size
const iconHTML = '' // <div className="innerMarker"></div>'

const endIcon = Leaflet.divIcon({
  className: 'LeafletIcon End map__marker map__marker--end',
  html: iconHTML,
  iconAnchor,
  iconSize
})

const startIcon = Leaflet.divIcon({
  className: 'LeafletIcon Start map__marker map__marker--start',
  html: iconHTML,
  iconAnchor,
  iconSize
})

const realtorIcon = Leaflet.divIcon({
  className: 'LeafletIcon Other map__marker map__marker--realtor',
  html: iconHTML,
  iconAnchor,
  iconSize
})

const otherIcon = Leaflet.divIcon({
  className: 'LeafletIcon Other map__marker map__marker--other',
  html: iconHTML,
  iconAnchor,
  iconSize
})

type Props = {
  centerCoordinates: Coordinate,
  clearStartAndEnd: () => void,
  drawIsochrones: Function[],
  drawOpportunityDatasets: Function[],
  drawRoute: any,
  drawListingRoute: any,
  end: null | Location,
  isLoading: boolean,
  pointsOfInterest: void | any, // FeatureCollection
  routableNeighborhoods: any,
  setEndPosition: LonLat => void,
  setStartPosition: LonLat => void,
  start: null | Location,
  updateEnd: () => void,
  updateMap: any => void,
  updateOrigin: () => void,
  updateStart: () => void,
  zoom: number
}

type State = {
  lastClickedLabel: null | string,
  lastClickedPosition: null | Coordinate,
  showSelectStartOrEnd: boolean,
}

/**
 *
 */
export default class Map extends PureComponent<Props, State> {
  constructor (props) {
    super(props)

    this.listingPopup = this.listingPopup.bind(this)
    this.clickNeighborhood = this.clickNeighborhood.bind(this)
    this.hoverNeighborhood = this.hoverNeighborhood.bind(this)
  }

  state = {
    lastClickedLabel: null,
    lastClickedPosition: null,
    showSelectStartOrEnd: false,
    showListingRoute: false
  }

  componentDidCatch (error) {
    console.error(error)
  }

  componentWillReceiveProps (nextProps) {
    const needToZoomOut = !nextProps.showDetails && this.props.showDetails
    const map = this.refs ? get(this.refs, 'map.leafletElement') : null

    if (needToZoomOut && nextProps.neighborhoodBoundsExtent) {
      map.fitBounds(nextProps.neighborhoodBoundsExtent)
    }
  }

  /*
    this.state.data.map((item, key) =>
      <Marker
        icon={otherIcon}
        key={`listings-${this._getKey()}`}
        position={[item.lat,item.lon]}
        zIndex={getZIndex()}>
      </Marker>
    )
  */

  listingPopup (photos, address, community, price, url) {
    return(
      <div>
        <Carousel showIndicators={false} dynamicHeight={true}>
          {photos.map((item, key) =>
            <div key={`listings-image-${this._getKey()}`}>
              <img src={item.href}/> <br />
            </div>
          )}
        </Carousel>
        Address: {address.line} <br />
        {community && <div>Price: ${community.price_min} - ${community.price_max}/month</div>}
        {price && <div>Price: ${price}/month</div>}
        <a href={url} target='_blank'>Click for Listing</a>
      </div>
    )
  }
  // Click on map marker for a neighborhood
  clickNeighborhood = (feature) => {
    // only go to routable neighborhood details
    if (feature.properties.routable) {
      this.props.setShowListings(false)
      this.setState({showListingRoute: false})
      this.props.setActiveListing(null)
      this.props.setShowDetails(true)
      this.props.setActiveNeighborhood(feature.properties.id)
    } else {
      console.warn('clicked unroutable neighborhood ' + feature.properties.id)
    }
  }

  clickListing = (lat, lon) => {
    this.props.setActiveListing([lon, lat])
    this.setState({showListingRoute: true})
  }

  // Debounced version of setActiveNeighborhood used on hover
  debouncedSetActive = debounce(this.props.setActiveNeighborhood, 100)

  // Hover over neighborhood map bounds or marker
  hoverNeighborhood = (feature, event) => {
    if (this.props.showDetails || !feature || !feature.properties) return
    if (feature.properties.routable) {
      this.debouncedSetActive(feature.properties.id)
    }
  }

  /**
   * Reset state
   */
  _clearState () {
    this.setState({
      lastClickedLabel: null,
      lastClickedPosition: null,
      showSelectStartOrEnd: false,
      showListingRoute: false
    })
  }

  _clearStartAndEnd = (): void => {
    this.props.clearStartAndEnd()
    this._clearState()
  }

  _onMapClick = (e: Leaflet.MouseEvent): void => {
    this.setState((previousState) => ({
      lastClickedPosition: e.latlng || e.target._latlng,
      showSelectStartOrEnd: !previousState.showSelectStartOrEnd
    }))
  }

  _setEnd = (): void => {
    const p = this.props
    const s = this.state
    if (s.lastClickedPosition) {
      const position = lonlat(s.lastClickedPosition)
      if (s.lastClickedLabel) p.updateEnd({label: s.lastClickedLabel, position})
      else p.setEndPosition(position)
    }
    this._clearState()
  }

  _setStart = (): void => {
    const p = this.props
    const s = this.state
    if (s.lastClickedPosition) {
      const position = lonlat(s.lastClickedPosition)
      if (s.lastClickedLabel) p.updateStart({label: s.lastClickedLabel, position})
      else p.setStartPosition(position)
    }
    this._clearState()
  }

  _setZoom = (e: MapEvent) => {
    const zoom = e.target._zoom
    this.props.updateMap({zoom})
  }

  _clickPoi = (feature) => {
    this.setState({
      lastClickedLabel: feature.properties.label,
      lastClickedPosition: lonlat.toLeaflet(feature.geometry.coordinates),
      showSelectStartOrEnd: true
    })
  }

  _key = 0
  _getKey () { return this._key++ }

  /* eslint complexity: 0 */
  render () {
    const p = this.props
    const clickNeighborhood = this.clickNeighborhood
    const hoverNeighborhood = this.hoverNeighborhood
    const styleNeighborhood = this.styleNeighborhood
    const listingPopup = this.listingPopup
    const clickListing = this.clickListing

    // Index elements with keys to reset them when elements are added / removed
    this._key = 0
    let zIndex = 0
    const getZIndex = () => zIndex++

    return (
      p.routableNeighborhoods ? <LeafletMap
        bounds={p.neighborhoodBoundsExtent}
        center={p.centerCoordinates}
        className='Taui-Map map'
        onZoomend={this._setZoom}
        zoom={p.zoom}
        onClick={this._onMapClick}
        ref='map'
        zoomControl={false}
      >
        <ZoomControl position='topright' />
        <TileLayer
          {...TILE_OPTIONS}
          url={TILE_URL}
          zIndex={getZIndex()}
        />

        {LABEL_URL &&
          <TileLayer
            {...TILE_OPTIONS}
            key={`tile-layer-${this._getKey()}`}
            url={LABEL_URL}
            zIndex={getZIndex()}
          />}

        {p.showRoutes && p.drawRoute && !this.state.showListingRoute &&
          <DrawRoute
            {...p.drawRoute}
            activeNeighborhood={p.activeNeighborhood}
            key={`draw-routes-${p.drawRoute.id}-${this._getKey()}`}
            showDetails={p.showDetails}
            zIndex={getZIndex()}
          />}

        {!p.isLoading && p.routableNeighborhoods &&
          <DrawNeighborhoodBounds
            key={`start-${this._getKey()}`}
            clickNeighborhood={clickNeighborhood}
            hoverNeighborhood={hoverNeighborhood}
            neighborhoods={p.routableNeighborhoods}
            styleNeighborhood={styleNeighborhood}
            zIndex={getZIndex()}
          />}

        {!p.isLoading && p.activeNeighborhoodBounds &&
          <VGrid
            data={p.activeNeighborhoodBounds}
            interactive={false}
            key={`active-bounds-${p.activeNeighborhood}-${this._getKey()}`}
            vectorTileLayerStyles={
              {'sliced': NEIGHBORHOOD_ACTIVE_BOUNDS_STYLE}
            }
            zIndex={getZIndex()}
          />}

        {p.origin &&
          <Marker
            icon={startIcon}
            key={`start-${this._getKey()}`}
            position={p.origin.position}
            zIndex={getZIndex()}>
            <Popup>
              <span>{p.origin.label}</span>
            </Popup>
          </Marker>}

        {/*
          this.state.data.map((item, key) =>
            <Marker
              icon={otherIcon}
              key={`listings-${this._getKey()}`}
              position={[item.lat,item.lon]}
              zIndex={getZIndex()}>
            </Marker>
          )
        */}

        {
          p.showListings && p.dataListings.map((item, key) =>
            <Marker
              icon={realtorIcon}
              key={`listings-${this._getKey()}`}
              position={[item.address.lat,item.address.lon]}
              zIndex={getZIndex()}
              onClick={ () => clickListing(item.address.lat, item.address.lon) }>

              <Popup>
                {listingPopup(item.photos,item.address,item.community,item.price,item.rdc_web_url)}
              </Popup>

            </Marker>
          )
        }

        {
          p.showListings && p.bhaListings.map((item, key) =>
            <Marker
              key={`listings-${this._getKey()}`}
              position={[item.latLon.lat,item.latLon.lng]}
              zIndex={getZIndex()}
              onClick={ () => clickListing(item.latLon.lat, item.latLon.lng) }>

              <Popup>
                <span>{item.locAddress}</span>
              </Popup>

            </Marker>
          )
        }

        {p.showListings && this.state.showListingRoute && p.drawListingRoute &&
          <DrawRoute
            {...p.drawListingRoute}
            activeNeighborhood={p.activeNeighborhood}
            key={`draw-routes-${p.drawRoute.id}-${this._getKey()}`}
            showDetails={p.showDetails}
            zIndex={getZIndex()}
          />}


        {!p.showDetails && p.displayNeighborhoods && p.displayNeighborhoods.length &&
          p.displayNeighborhoods.map((n) =>
            <Marker
              icon={n.properties.id === p.activeNeighborhood ? endIcon : otherIcon}
              key={`n-${n.properties.id}-${this._getKey()}`}
              onClick={(e) => clickNeighborhood(n)}
              onHover={(e) => hoverNeighborhood(n)}
              position={lonlat.toLeaflet(n.geometry.coordinates)}
              zIndex={getZIndex()}
            />)
          }
      </LeafletMap> : null
    )
  }
  /* eslint complexity: 1 */
}
