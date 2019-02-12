// @flow
import React, {Component} from 'react'
import { Link, Switch, Route } from 'react-router-dom'

import type {
  Coordinate,
  GeocoderStore,
  LogItems,
  LonLat,
  PointsOfInterest,
  UIStore
} from '../types'

import MainPage from './main-page'

type Network = {
  active: boolean,
  name: string
}

type MapState = {
  centerCoordinates: Coordinate,
  zoom: number
}

type Props = {
  accessibility: number[][],
  actionLog: LogItems,
  activeTransitive: any,
  allTransitive: any,
  data: {
    grids: string[],
    networks: Network[]
  },
  drawIsochrones: Function[],
  drawOpportunityDatasets: any[],
  drawRoutes: any[],
  geocode: (string, Function) => void,
  geocoder: GeocoderStore,
  initialize: Function => void,
  isLoading: boolean,
  isochrones: any[],
  map: MapState,
  neighborhoods: any,
  pointsOfInterest: any, // FeatureCollection
  pointsOfInterestOptions: PointsOfInterest,
  reverseGeocode: (string, Function) => void,
  setEnd: any => void,
  setSelectedTimeCutoff: any => void,

  setStart: any => void,
  showComparison: boolean,
  timeCutoff: any,
  travelTimes: number[],
  ui: UIStore,
  uniqueRoutes: any[],
  updateEnd: any => void,
  updateEndPosition: LonLat => void,
  updateMap: any => void,
  updateStart: any => void,
  updateStartPosition: LonLat => void
}

type State = {
  componentError: any
}

/**
 *
 */
export default class Application extends Component<Props, State> {
  state = {
    componentError: null
  }

  /**
   * Top level component error catch
   */
  componentDidCatch (error, info) {
    this.setState({
      componentError: {
        error, info
      }
    })
  }

  /**
   * Initialize the application.
   */
  componentDidMount () {
    if (window) {
      window.Application = this
    }
  }

  /**
   *
   */
  render () {
    const props = this.props
    return (
      <Switch>
        <Route exact path='/' component={Main} />
        <Route path='/map' render={() => <MainPage {...props} />} />
        <Route path='/test' component={Test} />
      </Switch>
    )
  }
}

const Main = () => (
  <div>
    <div className='Splash'>
      <div className='Logo' />
      <h4>Boston Housing Authority</h4>
      <h2>ECHO Locator</h2>
      <div className='Splash-Box'>
        <Link to='/map'>Go to map</Link>
        <br />
        <Link to='/test'>Test route</Link>
      </div>
    </div>
  </div>
)

const Test = () => (
  <h2>Something else</h2>
)
