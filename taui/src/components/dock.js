// @flow
import Icon from '@conveyal/woonerf/components/icon'
import message from '@conveyal/woonerf/message'
import {PureComponent} from 'react'

import {SIDEBAR_PAGE_SIZE, NETWORK_COLORS} from '../constants'
import type {PointFeature} from '../types'
import getActiveNeighborhood from '../utils/get-active-neighborhood'

import NeighborhoodDetails from './neighborhood-details'
import NeighborhoodListInfo from './neighborhood-list-info'
import RouteCard from './route-card'
import RouteSegments from './route-segments'

type Props = {
  activeNetworkIndex: number,
  isLoading: boolean,
  neighborhoodRoutes: any,
  neighborhoods: Array<PointFeature>,
  showSpinner: boolean,
  travelTimes: number[]
}

/**
 * Sidebar content.
 */
export default class Dock extends PureComponent<Props> {
  props: Props

  constructor (props) {
    super(props)

    this.backFromDetails = this.backFromDetails.bind(this)
    this.goPreviousPage = this.goPreviousPage.bind(this)
    this.goNextPage = this.goNextPage.bind(this)
    this.goToDetails = this.goToDetails.bind(this)

    this.state = {
      componentError: props.componentError,
      page: 0,
      showDetails: false
    }
  }

  backFromDetails () {
    this.setState({showDetails: false})
  }

  goPreviousPage () {
    const page = this.state.page
    if (page >= 1) {
      this.setState({page: page - 1})
    } else {
      console.warn('Cannot move back from page ' + page)
      this.setState({page: 0})
    }
  }

  goNextPage () {
    const page = this.state.page
    this.setState({page: page + 1})
  }

  goToDetails (neighborhood) {
    this.props.setActiveNeighborhood(neighborhood.properties.id)
    this.setState({showDetails: true})
  }

  render () {
    const {
      activeNeighborhood,
      activeNetworkIndex,
      children,
      isLoading,
      neighborhoodsSortedWithRoutes,
      setActiveNeighborhood,
      showSpinner
    } = this.props
    const {componentError, page, showDetails} = this.state
    const backFromDetails = this.backFromDetails
    const goPreviousPage = this.goPreviousPage
    const goNextPage = this.goNextPage
    const goToDetails = this.goToDetails
    const haveNeighborhoods = neighborhoodsSortedWithRoutes && neighborhoodsSortedWithRoutes.length

    const startingOffset = page * SIDEBAR_PAGE_SIZE
    const neighborhoodPage = haveNeighborhoods ? neighborhoodsSortedWithRoutes.slice(
      startingOffset, SIDEBAR_PAGE_SIZE + startingOffset) : []

    const haveAnotherPage = haveNeighborhoods > (startingOffset + SIDEBAR_PAGE_SIZE)

    const detailNeighborhood = getActiveNeighborhood(neighborhoodsSortedWithRoutes,
      activeNeighborhood)

    return <div className='Taui-Dock'>
      <div className='Taui-Dock-content sidebar-dock'>
        <div className='title'>
          {showSpinner
            ? <Icon type='spinner' className='fa-spin' />
            : <Icon type='map' />}
          {' '}
          {message('Title')}
        </div>
        {componentError &&
          <div>
            <h1>Error</h1>
            <p>componentError.info}</p>
          </div>}
        {children}
        {!isLoading && !showDetails && neighborhoodPage && neighborhoodPage.length &&
          neighborhoodPage.map((neighborhood, index) =>
            neighborhood.segments && neighborhood.segments.length
              ? (<RouteCard
                cardColor={neighborhood.active ? 'green' : NETWORK_COLORS[activeNetworkIndex]}
                goToDetails={goToDetails}
                index={index}
                key={`${index}-route-card`}
                neighborhood={neighborhood}
                setActiveNeighborhood={setActiveNeighborhood}
                title={neighborhood.properties.town + ': ' + neighborhood.properties.id}>
                <RouteSegments
                  routeSegments={neighborhood.segments}
                  travelTime={neighborhood.time}
                />
                <NeighborhoodListInfo
                  neighborhood={neighborhood}
                />
              </RouteCard>) : null)}
        {!isLoading && showDetails &&
          <NeighborhoodDetails
            neighborhood={detailNeighborhood} />
        }
        <div className='account-profile__destination_row'>
          {showDetails && <button
            className='account-profile__button account-profile__button--secondary account-profile__destination_narrow_field'
            onClick={backFromDetails}>{message('Dock.GoBackFromDetails')}
          </button>}
          {!showDetails && page > 0 && <button
            className='account-profile__button account-profile__button--secondary account-profile__destination_narrow_field'
            onClick={goPreviousPage}>{message('Dock.GoPreviousPage')}
          </button>}
          {!showDetails && haveAnotherPage && <button
            className='account-profile__button account-profile__button--secondary account-profile__destination_narrow_field'
            onClick={goNextPage}>{message('Dock.GoNextPage')}
          </button>}
        </div>
        <div className='Attribution'>
          site made by {' '}
          <a href='https://www.azavea.com' target='_blank' />
        </div>
      </div>
    </div>
  }
}
