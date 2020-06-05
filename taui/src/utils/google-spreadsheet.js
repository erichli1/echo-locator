// Gsheet API Key + BHA Listings Spreadsheet ID:
// tester:1-oSni5SVKOjj_9YR4LPKN7N4UgPdi3eeFA8sM-X0XNw
// real: 1aTsG_fm5CGYWiM-YJkfXKzJwEVWjo7-HNQ9t1S6_jQY
const SHEET_ID = '1JVIaWGXZ71jeyjGhyTEG5S-jyzsW-UXq1HoxydLtJ-A'
const RANGES = 'Sheet1'
// or: Form+Responses+1

// BHA Apartment Listing:1JVIaWGXZ71jeyjGhyTEG5S-jyzsW-UXq1HoxydLtJ-A


import axios from 'axios'
//GSHEET_API_KEY
//reads from BHA Coronvirus google sheets -> returns data from spreadsheet SHEET_ID for RANGES as specified.
export default function readSheetValues(zipcode, maxBudget, rooms) {

  return axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet?ranges=${RANGES}&majorDimension=ROWS&key=${process.env.GSHEET_API_KEY}`)
    .then(response => {
      var rows = []

      const data = response.data
      let batchRowValues = data.valueRanges[0].values;

      for (let i = 1; i < batchRowValues.length; i++) {
        let rowObject = {};
        for (let j = 0; j < batchRowValues[i].length; j++) {
          rowObject[batchRowValues[0][j]] = batchRowValues[i][j];
        }

        //ensures that the zip code of the google sheet has the proper 5-digit formatting for consistency. 
        if(rowObject['ZIP CODE (xxxxx)'].length == 4) {
          rowObject['ZIP CODE (xxxxx)'] = '0' + rowObject['ZIP CODE (xxxxx)']
        } else if (rowObject['ZIP CODE (xxxxx)'].length > 5) {
          rowObject['ZIP CODE (xxxxx)'] = rowObject['ZIP CODE (xxxxx)'].substring(0,5)
        }

        if(rowObject['ZIP CODE (xxxxx)'] == zipcode && rowObject['Bedroom Type'] <= rooms && rowObject['Rent'] <= maxBudget) {
          rows.push(rowObject)
        }
      }
      const promises = rows.map((item, key) => {
        return fwdGeocode(item.locAddress)
      })

      return Promise.all(promises).then((results) => {
        for(var i = 0; i < results.length; i++) {
          rows[i].latLon = results[i]
        }
        console.log(rows)
        return rows
      })
    })
    .catch(err => {
      console.log(err)
    })
}


//address to coordinate, using MapQuest
export function fwdGeocode(address){
  return axios.get(`http://www.mapquestapi.com/geocoding/v1/address?key=${process.env.MAPQUEST_API_KEY}&location=${address}`)
    .then(response => {

      return response.data.results[0].locations[0].latLng

    })
    .catch(err => {
        console.log("fwdGeo", err)
    })
}
