// @flow
import Icon from '@conveyal/woonerf/components/icon'
import message from '@conveyal/woonerf/message'
import uniq from 'lodash/uniq'
import {PureComponent} from 'react'

import type {AccountProfile, NeighborhoodLabels} from '../types'
import getGoogleDirectionsLink from '../utils/google-directions-link'
import getGoogleSearchLink from '../utils/google-search-link'
import getNeighborhoodPropertyLabels from '../utils/neighborhood-properties'

import RouteSegments from './route-segments'

type Props = {
  changeUserProfile: any,
  neighborhood: any,
  setFavorite: any,
  userProfile: AccountProfile
}
export default class NeighborhoodDetails extends PureComponent<Props> {
  props: Props

  constructor (props) {
    super(props)

    this.state = {isFavorite: props.userProfile && props.neighborhood
      ? props.userProfile.favorites.indexOf(props.neighborhood.properties.id) !== -1
      : false
    }

    this.neighborhoodDetailsTable = this.neighborhoodDetailsTable.bind(this)
    this.neighborhoodImage = this.neighborhoodImage.bind(this)
    this.neighborhoodImages = this.neighborhoodImages.bind(this)
    this.neighborhoodLinks = this.neighborhoodLinks.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.userProfile && nextProps.neighborhood) {
      const isFavorite = nextProps.userProfile.favorites.indexOf(
        nextProps.neighborhood.properties.id) !== -1
      this.setState({isFavorite})
    }
  }

  neighborhoodDetailsTable (props) {
    const { neighborhood } = props
    const labels: NeighborhoodLabels = getNeighborhoodPropertyLabels(neighborhood.properties)

    // Overall score is a derived value and not a neighborhood property (so not in `labels`).
    const overallScore = neighborhood.score
      ? neighborhood.score.toLocaleString('en-US', {style: 'percent'})
      : message('UnknownValue')

    return (
      <table className='neighborhood-details__facts'>
        <tbody>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.Score')}:</td>
            <td className='neighborhood-details__cell'>{overallScore}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.Affordability')}:</td>
            <td className='neighborhood-details__cell'>{labels.affordability}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.ViolentCrime')}:</td>
            <td className='neighborhood-details__cell'>{labels.violentCrime}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.EducationCategory')}:</td>
            <td className='neighborhood-details__cell'>{labels.education}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.EducationPercentile')}:</td>
            <td className='neighborhood-details__cell'>{labels.educationPercentile}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.Population')}:</td>
            <td className='neighborhood-details__cell'>{labels.population}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.PercentCollegeGraduates')}:</td>
            <td className='neighborhood-details__cell'>{labels.percentCollegeGraduates}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.HasTransitStop')}:</td>
            <td className='neighborhood-details__cell'>{labels.hasTransitStop}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.NearTransit')}:</td>
            <td className='neighborhood-details__cell'>{labels.nearTransitStop}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.NearRailStation')}:</td>
            <td className='neighborhood-details__cell'>{labels.nearRailStation}</td>
          </tr>
          <tr className='neighborhood-details__row'>
            <td className='neighborhood-details__cell'>{message('NeighborhoodInfo.NearPark')}:</td>
            <td className='neighborhood-details__cell'>{labels.nearPark}</td>
          </tr>
        </tbody>
      </table>
    )
  }

  neighborhoodImage (props) {
    const nprops = props.nprops
    const imageField = props.imageField

    if (!imageField || !nprops) {
      console.error('missing data for neighborhood image')
      return null
    }

    const description = nprops[imageField + '_description']
    const license = nprops[imageField + '_license']
    const licenseUrl = nprops[imageField + '_license_url']
    const imageLink = nprops[imageField]
    const thumbnail = nprops[imageField + '_thumbnail']
    const userName = nprops[imageField + '_username']

    if (!thumbnail) {
      return null
    }

    // Build the attribution text to display on hover
    let attrText = userName + ' [' + license
    if (licenseUrl) {
      attrText += ' (' + licenseUrl + ')'
    }
    attrText += '], ' + message('NeighborhoodDetails.WikipediaAttribution')

    return (
      <a
        className='neighborhood-details__image'
        target='_blank'
        title={attrText}
        href={imageLink}>
        <img
          alt={description}
          src={thumbnail} />
      </a>
    )
  }

  neighborhoodImages (props) {
    const nprops = props.neighborhood.properties
    const NeighborhoodImage = this.neighborhoodImage

    // Use street picture if any of the other three images are missing
    const showStreet = !nprops.open_space_or_landmark_thumbnail ||
      !nprops.school_thumbnail || !nprops.town_square_thumbnail

    return (
      <div className='neighborhood-details__images'>
        {nprops.open_space_or_landmark_thumbnail && <NeighborhoodImage
          imageField='open_space_or_landmark'
          nprops={nprops} />}
        {nprops.school_thumbnail && <NeighborhoodImage
          imageField='school'
          nprops={nprops} />}
        {nprops.town_square_thumbnail && <NeighborhoodImage
          imageField='town_square'
          nprops={nprops} />}
        {showStreet && nprops.street_thumbnail && <NeighborhoodImage
          imageField='street'
          nprops={nprops} />}
      </div>
    )
  }

  neighborhoodLinks (props) {
    const { hasVehicle, neighborhood, origin } = this.props
    // lat,lon strings for Google Directions link from neighborhood to current destination
    const destinationCoordinateString = origin.position.lat + ',' + origin.position.lon
    const originCoordinateString = neighborhood.geometry.coordinates[1] +
      ',' + neighborhood.geometry.coordinates[0]

    return (
      <div className='neighborhood-details__links'>
        {neighborhood.properties.town_link && <a
          className='neighborhood-details__link'
          href={neighborhood.properties.town_link}
          target='_blank'
        >
          {message('NeighborhoodDetails.WebsiteLink')}
        </a>}
        {neighborhood.properties.wikipedia_link && <a
          className='neighborhood-details__link'
          href={neighborhood.properties.wikipedia_link}
          target='_blank'
        >
          {message('NeighborhoodDetails.WikipediaLink')}
        </a>}
        <a
          className='neighborhood-details__link'
          href={getGoogleSearchLink(neighborhood.properties.id)}
          target='_blank'
        >
          {message('NeighborhoodDetails.GoogleSearchLink')}
        </a>
        <a
          className='neighborhood-details__link'
          href={getGoogleDirectionsLink(
            originCoordinateString,
            destinationCoordinateString,
            hasVehicle)}
          target='_blank'
        >
          {message('NeighborhoodDetails.GoogleMapsLink')}
        </a>
      </div>
    )
  }

  render () {
    const { changeUserProfile, neighborhood, origin, setFavorite, userProfile } = this.props
    const isFavorite = this.state.isFavorite
    const hasVehicle = userProfile ? userProfile.hasVehicle : false
    const NeighborhoodDetailsTable = this.neighborhoodDetailsTable
    const NeighborhoodImages = this.neighborhoodImages
    const NeighborhoodLinks = this.neighborhoodLinks

    if (!neighborhood || !userProfile) {
      return null
    }

    // Look up the currently selected user profile destination from the origin
    const originLabel = origin ? origin.label || '' : ''
    const currentDestination = userProfile.destinations.find(d => d.location.label === originLabel)
    const { id, town, wikipedia } = neighborhood.properties

    const bestJourney = neighborhood.segments && neighborhood.segments.length
      ? neighborhood.segments[0] : null

    return (
      <div className='neighborhood-details'>
        <header className='neighborhood-details__header'>
          <Icon
            className='neighborhood-details__star'
            type={isFavorite ? 'star' : 'star-o'}
            onClick={(e) => setFavorite(id, userProfile, changeUserProfile)}
          />
          {town} &ndash; {id}
          <Icon className='neighborhood-details__marker' type='map-marker' />
        </header>
        {!hasVehicle && <div className='neighborhood-details__trip'>
          {Math.round(neighborhood.time)}&nbsp;
          {message('Units.Mins')}&nbsp;
          <ModesList segments={bestJourney} />&nbsp;
          {message('NeighborhoodDetails.FromOrigin')}&nbsp;
          {currentDestination && currentDestination.purpose.toLowerCase()}
        </div>}
        {hasVehicle && <RouteSegments
          hasVehicle={hasVehicle}
          routeSegments={neighborhood.segments}
          travelTime={neighborhood.time}
        />}
        <NeighborhoodImages neighborhood={neighborhood} />
        <div className='neighborhood-details__desc'>
          {wikipedia}
        </div>
        <NeighborhoodLinks
          hasVehicle={hasVehicle}
          neighborhood={neighborhood}
          origin={origin} />
        <NeighborhoodDetailsTable neighborhood={neighborhood} />
      </div>
    )
  }
}

// Builds list of unqiue transit modes used in a trip
const ModesList = ({segments}) => segments && segments.length ? (
  <>
    {message('NeighborhoodDetails.ModeSummary')}&nbsp;
    {uniq(segments.map(s => s.type)).join('/')}
  </>
) : message('NeighborhoodDetails.DriveMode')
